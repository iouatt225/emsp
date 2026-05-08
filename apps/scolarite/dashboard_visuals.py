from __future__ import annotations

from collections import Counter, defaultdict
from datetime import timedelta

from django.db import connection
from django.db.models import Sum
from django.utils import timezone

from apps.comptabilite.models import Paiement
from apps.inscriptions.models import Candidature

from .models import Etudiant

EMSP_HUB = {
    "name": "EMSP Abidjan",
    "city": "Abidjan",
    "lat": 5.359952,
    "lng": -4.008256,
}

COUNTRY_COORDINATES = {
    "BJ": {"label": "Benin", "city": "Cotonou", "lat": 6.370293, "lng": 2.391236},
    "BF": {"label": "Burkina Faso", "city": "Ouagadougou", "lat": 12.371428, "lng": -1.51966},
    "CI": {"label": "Cote d'Ivoire", "city": "Abidjan", "lat": 5.359952, "lng": -4.008256},
    "ML": {"label": "Mali", "city": "Bamako", "lat": 12.639232, "lng": -8.002889},
    "MR": {"label": "Mauritanie", "city": "Nouakchott", "lat": 18.07353, "lng": -15.958237},
    "NE": {"label": "Niger", "city": "Niamey", "lat": 13.511596, "lng": 2.125385},
    "SN": {"label": "Senegal", "city": "Dakar", "lat": 14.716677, "lng": -17.467686},
    "TG": {"label": "Togo", "city": "Lome", "lat": 6.130419, "lng": 1.215829},
}

COUNTRY_LABELS = dict(Etudiant.PAYS_MEMBRES)


def _model_table_exists(model) -> bool:
    return model._meta.db_table in connection.introspection.table_names()


def _safe_float(value):
    return float(value or 0)


def _country_label(code: str) -> str:
    return COUNTRY_LABELS.get(code, code or "EMSP")


def _age_bucket(age):
    if age is None:
        return "Non renseigne"
    if age <= 18:
        return "18 ans et moins"
    if age <= 21:
        return "19 a 21 ans"
    if age <= 24:
        return "22 a 24 ans"
    return "25 ans et plus"


def _normalized_hobby_tags(value: str) -> list[str]:
    raw = str(value or "").replace("/", ",").replace(";", ",")
    return [item.strip().title() for item in raw.split(",") if item.strip()]


def build_dashboard_stream_point():
    confirmed_revenue = 0.0
    pending_payments = 0
    pending_applications = 0
    active_students = 0

    if _model_table_exists(Paiement):
        confirmed_revenue = _safe_float(
            Paiement.objects.filter(statut="confirmed").aggregate(total=Sum("montant"))["total"]
        )
        pending_payments = Paiement.objects.filter(statut="pending").count()

    if _model_table_exists(Candidature):
        pending_applications = Candidature.objects.filter(status__in=["submitted", "under_review"]).count()

    if _model_table_exists(Etudiant):
        active_students = Etudiant.objects.filter(is_active=True).count()

    now = timezone.localtime()

    return {
        "timestamp": now.isoformat(),
        "label": now.strftime("%H:%M:%S"),
        "revenue": round(confirmed_revenue, 2),
        "pending_payments": pending_payments,
        "pending_applications": pending_applications,
        "active_students": active_students,
    }


def build_dashboard_stream_seed(points: int = 18):
    snapshot = build_dashboard_stream_point()
    now = timezone.localtime()
    seed = []

    revenue = snapshot["revenue"]
    pending_payments = snapshot["pending_payments"]
    pending_applications = snapshot["pending_applications"]
    active_students = snapshot["active_students"]

    for index in range(points):
        ratio = (index + 1) / max(points, 1)
        curve = ((index % 5) - 2) * 0.025
        point_time = now - timedelta(seconds=(points - index) * 12)
        seed.append(
            {
                "timestamp": point_time.isoformat(),
                "label": point_time.strftime("%H:%M:%S"),
                "revenue": round(max(revenue * (0.82 + ratio * 0.18 + curve), 0), 2),
                "pending_payments": max(int(round(pending_payments + ((index % 4) - 1))), 0),
                "pending_applications": max(int(round(pending_applications + ((index % 3) - 1))), 0),
                "active_students": max(int(round(active_students * (0.96 + ratio * 0.04))), 0),
            }
        )

    return seed


def _portal_force_graph_payload(students):
    nodes_by_id = {}
    links = []
    formation_counts = Counter()
    country_counts = Counter()
    promotion_counts = Counter()

    for student in students:
        formation_counts[student.formation_id] += 1
        country_counts[student.pays] += 1
        if student.promotion_id:
            promotion_counts[student.promotion_id] += 1

    sample = sorted(students, key=lambda item: item.enrolled_at, reverse=True)[:28]

    nodes_by_id["hub-emsp"] = {
        "id": "hub-emsp",
        "name": "EMSP",
        "type": "hub",
        "value": max(len(sample), 8),
        "color": "#0f172a",
    }

    for student in sample:
        formation_id = f"formation-{student.formation_id}"
        if formation_id not in nodes_by_id:
            nodes_by_id[formation_id] = {
                "id": formation_id,
                "name": student.formation.code,
                "type": "formation",
                "value": max(formation_counts[student.formation_id], 4),
                "color": "#f59e0b",
            }
            links.append({"source": "hub-emsp", "target": formation_id, "value": formation_counts[student.formation_id]})

        country_id = f"country-{student.pays}"
        if country_id not in nodes_by_id:
            nodes_by_id[country_id] = {
                "id": country_id,
                "name": _country_label(student.pays),
                "type": "country",
                "value": max(country_counts[student.pays], 3),
                "color": "#2563eb",
            }
            links.append({"source": "hub-emsp", "target": country_id, "value": country_counts[student.pays]})

        promotion_key = f"promotion-{student.promotion_id or 'none'}"
        promotion_label = student.promotion.label if student.promotion else "Sans promotion"
        if promotion_key not in nodes_by_id:
            nodes_by_id[promotion_key] = {
                "id": promotion_key,
                "name": promotion_label,
                "type": "promotion",
                "value": max(promotion_counts.get(student.promotion_id, 1), 2),
                "color": "#8b5cf6",
            }
            links.append({"source": formation_id, "target": promotion_key, "value": max(promotion_counts.get(student.promotion_id, 1), 1)})

        student_id = f"student-{student.id}"
        nodes_by_id[student_id] = {
            "id": student_id,
            "name": student.user.full_name or student.matricule,
            "type": "student",
            "value": 2 + (1 if student.is_active else 0),
            "color": "#10b981" if student.is_active else "#f97316",
        }
        links.extend(
            [
                {"source": student_id, "target": formation_id, "value": 1.5},
                {"source": student_id, "target": promotion_key, "value": 1},
                {"source": student_id, "target": country_id, "value": 1},
            ]
        )

    return {"nodes": list(nodes_by_id.values()), "links": links}


def _legacy_force_graph_payload(legacy_results):
    nodes_by_id = {
        "legacy-emsp": {
            "id": "legacy-emsp",
            "name": "Base EMSP",
            "type": "hub",
            "value": max(len(legacy_results), 8),
            "color": "#0f172a",
        }
    }
    links = []
    hobby_counts = Counter()

    for item in legacy_results:
        hobby_counts.update(_normalized_hobby_tags(item.get("hobbies", ""))[:2])

    top_hobbies = {name for name, _ in hobby_counts.most_common(6)}
    sample = legacy_results[:24]

    for item in sample:
        gender_key = f"gender-{item.get('gender') or 'unknown'}"
        gender_name = item.get("gender_label") or "Non renseigne"
        if gender_key not in nodes_by_id:
            nodes_by_id[gender_key] = {
                "id": gender_key,
                "name": gender_name,
                "type": "gender",
                "value": 4,
                "color": "#2563eb",
            }
            links.append({"source": "legacy-emsp", "target": gender_key, "value": 2})

        student_id = f"legacy-student-{item['id']}"
        nodes_by_id[student_id] = {
            "id": student_id,
            "name": item.get("full_name") or item.get("matricule"),
            "type": "student",
            "value": 2,
            "color": "#10b981",
        }
        links.append({"source": student_id, "target": gender_key, "value": 1})

        for hobby in _normalized_hobby_tags(item.get("hobbies", ""))[:2]:
            if hobby not in top_hobbies:
                continue
            hobby_key = f"hobby-{hobby}"
            if hobby_key not in nodes_by_id:
                nodes_by_id[hobby_key] = {
                    "id": hobby_key,
                    "name": hobby,
                    "type": "hobby",
                    "value": max(hobby_counts[hobby], 2),
                    "color": "#f59e0b",
                }
                links.append({"source": "legacy-emsp", "target": hobby_key, "value": hobby_counts[hobby]})
            links.append({"source": student_id, "target": hobby_key, "value": 1})

    return {"nodes": list(nodes_by_id.values()), "links": links}


def _portal_sunburst_payload(students):
    root = {"name": "EMSP", "children": []}
    formation_tree = {}

    for student in students:
        formation_key = student.formation_id
        promotion_key = student.promotion_id or f"no-promotion-{student.formation_id}"
        country_key = student.pays

        formation_node = formation_tree.setdefault(
            formation_key,
            {
                "name": student.formation.nom,
                "children": {},
            },
        )
        promotion_node = formation_node["children"].setdefault(
            promotion_key,
            {
                "name": student.promotion.label if student.promotion else "Sans promotion",
                "children": Counter(),
            },
        )
        promotion_node["children"][country_key] += 1

    for formation_node in formation_tree.values():
        promotion_children = []
        for promotion_node in formation_node["children"].values():
            country_children = [
                {"name": _country_label(country_code), "value": total}
                for country_code, total in sorted(promotion_node["children"].items(), key=lambda item: item[1], reverse=True)
            ]
            promotion_children.append({"name": promotion_node["name"], "children": country_children})
        root["children"].append({"name": formation_node["name"], "children": promotion_children})

    return root


def _legacy_sunburst_payload(legacy_results):
    root = {"name": "EMSP", "children": []}
    gender_buckets = defaultdict(Counter)

    for item in legacy_results:
        gender = item.get("gender_label") or "Non renseigne"
        gender_buckets[gender][_age_bucket(item.get("age"))] += 1

    for gender, ages in gender_buckets.items():
        root["children"].append(
            {
                "name": gender,
                "children": [{"name": label, "value": total} for label, total in ages.items()],
            }
        )

    return root


def _build_globe_payload(student_country_counts=None):
    student_country_counts = student_country_counts or Counter()
    candidature_counts = Counter()
    if _model_table_exists(Candidature):
        candidature_counts = Counter(
            Candidature.objects.exclude(nationality="OTHER").values_list("nationality", flat=True)
        )

    globe_nodes = [
        {
            "name": EMSP_HUB["name"],
            "city": EMSP_HUB["city"],
            "lat": EMSP_HUB["lat"],
            "lng": EMSP_HUB["lng"],
            "value": max(sum(student_country_counts.values()), 1),
            "kind": "hub",
        }
    ]
    arcs = []

    for country_code, meta in COUNTRY_COORDINATES.items():
        students_total = student_country_counts.get(country_code, 0)
        candidature_total = candidature_counts.get(country_code, 0)
        combined_total = students_total + candidature_total
        if combined_total <= 0:
            continue

        globe_nodes.append(
            {
                "name": meta["label"],
                "city": meta["city"],
                "lat": meta["lat"],
                "lng": meta["lng"],
                "value": combined_total,
                "kind": "country",
            }
        )
        arcs.append(
            {
                "from_name": meta["city"],
                "to_name": EMSP_HUB["city"],
                "from_lat": meta["lat"],
                "from_lng": meta["lng"],
                "to_lat": EMSP_HUB["lat"],
                "to_lng": EMSP_HUB["lng"],
                "value": combined_total,
                "students": students_total,
                "candidatures": candidature_total,
            }
        )

    return {
        "hub": EMSP_HUB,
        "nodes": globe_nodes,
        "arcs": arcs,
    }


def build_advanced_dashboard_payload(dataset_mode: str, *, students=None, legacy_results=None):
    if dataset_mode == "legacy":
        legacy_results = legacy_results or []
        return {
            "force_graph": _legacy_force_graph_payload(legacy_results),
            "sunburst": _legacy_sunburst_payload(legacy_results),
            "globe": _build_globe_payload(),
            "stream_seed": build_dashboard_stream_seed(),
        }

    students = students or []
    student_country_counts = Counter(student.pays for student in students)
    return {
        "force_graph": _portal_force_graph_payload(students),
        "sunburst": _portal_sunburst_payload(students),
        "globe": _build_globe_payload(student_country_counts),
        "stream_seed": build_dashboard_stream_seed(),
    }
