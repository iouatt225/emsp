from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import connection, transaction
from django.db.models import Case, Count, DecimalField, ExpressionWrapper, F, Q, Sum, Value, When
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminFamily, IsDriver, IsFullAdminAccess, IsStudent
from apps.actualites.models import Article
from apps.actualites.serializers import ArticleListSerializer
from apps.comptabilite.models import Paiement
from apps.formations.models import Filiere
from apps.inscriptions.models import Candidature

from .demo import ensure_portal_demo_data
from .models import (
    EmploiDuTempsItem,
    Enseignant,
    Etudiant,
    ForumPost,
    Note,
    Promotion,
    StudentDocument,
    TransportCar,
    TransportCommune,
    TransportDepot,
    TransportDriver,
    TransportPayment,
    TransportRoute,
    TransportTrip,
)
from .serializers import (
    EmploiDuTempsSerializer,
    EnseignantSerializer,
    EtudiantSerializer,
    ForumPostSerializer,
    NoteSerializer,
    StudentDocumentSerializer,
    TransportCarSerializer,
    TransportCommuneSerializer,
    TransportDepotSerializer,
    TransportDriverSerializer,
    TransportPaymentSerializer,
    TransportRouteSerializer,
    TransportTripSerializer,
)

User = get_user_model()


class ForumCreateSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=[choice[0] for choice in ForumPost.CATEGORY_CHOICES])
    title = serializers.CharField(max_length=200)
    content = serializers.CharField()


def _paginated_payload(request, queryset, serializer):
    try:
        page = max(1, int(request.query_params.get("page", 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = max(1, min(200, int(request.query_params.get("page_size", 50))))
    except (TypeError, ValueError):
        page_size = 50

    total = queryset.count()
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "count": total,
        "results": serializer(queryset[start:end], many=True).data,
    }


def _parse_academic_year(value):
    raw = str(value or "").strip()
    if not raw:
        raise serializers.ValidationError("Annee academique obligatoire.")
    normalized = raw.replace("/", "-").replace(" ", "")
    parts = normalized.split("-")
    if len(parts) != 2:
        raise serializers.ValidationError("Format attendu: 2025-2026.")
    try:
        year_start = int(parts[0])
        year_end = int(parts[1])
    except ValueError as exc:
        raise serializers.ValidationError("L'annee academique doit contenir deux annees.") from exc
    if year_end != year_start + 1:
        raise serializers.ValidationError("L'annee de fin doit suivre l'annee de debut.")
    return year_start, year_end


class DashboardPromotionSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(source="label", read_only=True)
    formation = serializers.IntegerField(source="formation_id", read_only=True)
    formation_nom = serializers.CharField(source="formation.nom", read_only=True)
    annee_academique = serializers.CharField(source="academic_year", read_only=True)
    etudiants_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Promotion
        fields = [
            "id",
            "nom",
            "label",
            "formation",
            "formation_nom",
            "year_start",
            "year_end",
            "annee_academique",
            "academic_year",
            "etudiants_count",
        ]


class DashboardPromotionWriteSerializer(serializers.Serializer):
    nom = serializers.CharField(required=False, allow_blank=True, max_length=100)
    label = serializers.CharField(required=False, allow_blank=True, max_length=100)
    formation = serializers.CharField()
    annee_academique = serializers.CharField(required=False, allow_blank=True)
    year_start = serializers.IntegerField(required=False)
    year_end = serializers.IntegerField(required=False)

    def validate(self, attrs):
        label = " ".join((attrs.get("nom") or attrs.get("label") or "").split())
        if not label:
            raise serializers.ValidationError({"nom": "Nom obligatoire."})

        formation_ref = str(attrs.get("formation") or "").strip()
        formation = None
        if formation_ref.isdigit():
            formation = Filiere.objects.filter(pk=int(formation_ref)).first()
        if formation is None and formation_ref:
            formation = Filiere.objects.filter(code__iexact=formation_ref).first()
        if formation is None:
            raise serializers.ValidationError({"formation": "Formation introuvable."})

        if attrs.get("year_start") and attrs.get("year_end"):
            year_start = attrs["year_start"]
            year_end = attrs["year_end"]
            if year_end != year_start + 1:
                raise serializers.ValidationError({"annee_academique": "L'annee de fin doit suivre l'annee de debut."})
        else:
            year_start, year_end = _parse_academic_year(attrs.get("annee_academique"))

        attrs["label"] = label
        attrs["formation_obj"] = formation
        attrs["year_start"] = year_start
        attrs["year_end"] = year_end
        return attrs


DAY_INDEX = {
    "lundi": 0,
    "mardi": 1,
    "mercredi": 2,
    "jeudi": 3,
    "vendredi": 4,
    "samedi": 5,
    "dimanche": 6,
}


def _date_for_day(day_name):
    target = DAY_INDEX.get(str(day_name or "").strip().lower(), 0)
    today = timezone.localdate()
    monday = today - timedelta(days=today.weekday())
    return monday + timedelta(days=target)


class DashboardEmploiDuTempsSerializer(serializers.ModelSerializer):
    jour = serializers.SerializerMethodField()
    heure_debut = serializers.SerializerMethodField()
    heure_fin = serializers.SerializerMethodField()
    promotion = serializers.IntegerField(source="promotion_id", read_only=True)
    promotion_nom = serializers.CharField(source="promotion.label", read_only=True)
    matiere_nom = serializers.CharField(source="matiere", read_only=True)

    class Meta:
        model = EmploiDuTempsItem
        fields = [
            "id",
            "jour",
            "heure_debut",
            "heure_fin",
            "matiere",
            "matiere_nom",
            "enseignant",
            "salle",
            "type",
            "promotion",
            "promotion_nom",
            "debut",
            "fin",
        ]

    def get_jour(self, obj):
        return ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][timezone.localtime(obj.debut).weekday()]

    def get_heure_debut(self, obj):
        return timezone.localtime(obj.debut).strftime("%H:%M")

    def get_heure_fin(self, obj):
        return timezone.localtime(obj.fin).strftime("%H:%M")


class DashboardEmploiDuTempsWriteSerializer(serializers.Serializer):
    jour = serializers.CharField(required=False, allow_blank=True)
    heure_debut = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"], required=False)
    heure_fin = serializers.TimeField(input_formats=["%H:%M", "%H:%M:%S"], required=False)
    matiere = serializers.CharField(max_length=200)
    enseignant = serializers.CharField(required=False, allow_blank=True, max_length=200)
    salle = serializers.CharField(required=False, allow_blank=True, max_length=100)
    type = serializers.ChoiceField(choices=[choice[0] for choice in EmploiDuTempsItem.TYPE_CHOICES], required=False)
    promotion = serializers.IntegerField()

    def validate(self, attrs):
        promotion = Promotion.objects.filter(pk=attrs["promotion"]).first()
        if promotion is None:
            raise serializers.ValidationError({"promotion": "Promotion introuvable."})

        start = attrs.get("heure_debut")
        end = attrs.get("heure_fin")
        if start is None or end is None:
            raise serializers.ValidationError({"heure_debut": "Heure debut et heure fin obligatoires."})
        if end <= start:
            raise serializers.ValidationError({"heure_fin": "L'heure de fin doit etre apres l'heure de debut."})

        course_date = _date_for_day(attrs.get("jour"))
        attrs["promotion_obj"] = promotion
        attrs["debut"] = timezone.make_aware(datetime.combine(course_date, start))
        attrs["fin"] = timezone.make_aware(datetime.combine(course_date, end))
        attrs["type"] = attrs.get("type") or "cours"
        return attrs


class LegacyStudentWriteSerializer(serializers.Serializer):
    matricule = serializers.CharField(max_length=10)
    full_name = serializers.CharField(max_length=100)
    gender = serializers.ChoiceField(
        choices=[("M", "Masculin"), ("F", "Feminin")],
        required=False,
        allow_blank=True,
    )
    age = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=120)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    hobbies = serializers.CharField(required=False, allow_blank=True)

    def validate_matricule(self, value):
        return value.strip().upper()

    def validate_full_name(self, value):
        return " ".join(value.split())


class PortalStudentWriteSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    matricule = serializers.CharField(max_length=20)
    formation_id = serializers.IntegerField()
    promotion_id = serializers.IntegerField(required=False, allow_null=True)
    pays = serializers.ChoiceField(choices=[choice[0] for choice in Etudiant.PAYS_MEMBRES])
    date_naissance = serializers.DateField(required=False, allow_null=True)
    lieu_naissance = serializers.CharField(required=False, allow_blank=True, max_length=200)
    rang_promotion = serializers.IntegerField(required=False, min_value=1, default=1)
    solde_scolarite = serializers.DecimalField(
        required=False,
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    is_active = serializers.BooleanField(required=False, default=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate_matricule(self, value):
        return value.strip().upper()

    def validate(self, attrs):
        student = self.context.get("student")
        current_user = student.user if student else None

        formation = Filiere.objects.filter(pk=attrs["formation_id"]).first()
        if formation is None:
            raise serializers.ValidationError({"formation_id": "La filiere selectionnee est introuvable."})
        attrs["formation"] = formation

        promotion = None
        promotion_id = attrs.get("promotion_id")
        if promotion_id:
            promotion = Promotion.objects.select_related("formation").filter(pk=promotion_id).first()
            if promotion is None:
                raise serializers.ValidationError({"promotion_id": "La promotion selectionnee est introuvable."})
            if promotion.formation_id != formation.id:
                raise serializers.ValidationError(
                    {"promotion_id": "La promotion ne correspond pas a la filiere choisie."}
                )
        attrs["promotion"] = promotion

        email = attrs["email"].strip().lower()
        existing_user = User.objects.filter(email__iexact=email)
        if current_user is not None:
            existing_user = existing_user.exclude(pk=current_user.pk)
        if existing_user.exists():
            raise serializers.ValidationError({"email": "Un compte existe deja avec cet email."})

        existing_student = Etudiant.objects.filter(matricule__iexact=attrs["matricule"])
        if student is not None:
            existing_student = existing_student.exclude(pk=student.pk)
        if existing_student.exists():
            raise serializers.ValidationError({"matricule": "Ce matricule existe deja."})

        attrs["email"] = email
        attrs["username"] = email
        attrs["password"] = attrs.get("password") or "emsp12345"
        return attrs


def _student_for_user(user):
    student = Etudiant.objects.select_related("user", "formation", "promotion", "photo").filter(user=user).first()
    if student is None:
        raise NotFound("Aucun profil etudiant n'est lie a ce compte.")
    return student


def _weighted_average(notes):
    total_coeff = Decimal("0.00")
    total = Decimal("0.00")
    for note in notes:
        total_coeff += note.coefficient
        total += note.note * note.coefficient
    if not total_coeff:
        return Decimal("0.00")
    return (total / total_coeff).quantize(Decimal("0.01"))


def _format_currency(value):
    return f"{value:,.0f} FCFA".replace(",", " ")


def _sum_decimal(queryset, field):
    return queryset.aggregate(total=Sum(field))["total"] or Decimal("0.00")


def _media_url(request, media_item):
    if not media_item:
        return ""
    if getattr(media_item, "file", None):
        return request.build_absolute_uri(media_item.file.url)
    return media_item.video_url or ""


def _table_exists(table_name):
    return table_name in connection.introspection.table_names()


def _format_legacy_gender(value):
    normalized = (value or "").strip().upper()
    return {
        "M": "Masculin",
        "F": "Feminin",
    }.get(normalized, "Non renseigne")


def _empty_students_payload(dataset_mode):
    return {
        "dataset_mode": dataset_mode,
        "summary": {
            "total": 0,
            "active": 0,
            "inactive": 0,
            "promotions": 0,
            "outstanding_balance": 0,
        },
        "results": [],
    }


def _serialize_legacy_student(row, index):
    return {
        "id": index,
        "matricule": row.get("matricule", ""),
        "full_name": row.get("nom") or row.get("matricule", ""),
        "email": "",
        "phone": row.get("contact") or "",
        "formation_name": "Base etudiant EMSP",
        "formation_code": "EMSP",
        "promotion_label": "",
        "academic_year": "",
        "country": "EMSP",
        "country_label": "Base EMSP",
        "rank": 0,
        "balance": 0,
        "balance_label": _format_currency(Decimal("0.00")),
        "is_active": True,
        "status_label": "Disponible",
        "enrolled_at": "",
        "photo_url": "",
        "gender": (row.get("sexe") or "").strip().upper(),
        "gender_label": _format_legacy_gender(row.get("sexe")),
        "age": row.get("age"),
        "hobbies": row.get("hobbies") or "",
        "source": "emsp_legacy",
    }


def _serialize_portal_student(request, student):
    return {
        "id": student.id,
        "matricule": student.matricule,
        "first_name": student.user.first_name,
        "last_name": student.user.last_name,
        "full_name": student.user.full_name,
        "email": student.user.email,
        "phone": student.user.phone,
        "formation_id": student.formation_id,
        "formation_name": student.formation.nom,
        "formation_code": student.formation.code,
        "promotion_id": student.promotion_id,
        "promotion_label": student.promotion.label if student.promotion else "",
        "academic_year": student.promotion.academic_year if student.promotion else "",
        "country": student.pays,
        "country_label": student.get_pays_display(),
        "date_naissance": student.date_naissance,
        "lieu_naissance": student.lieu_naissance,
        "rank": student.rang_promotion,
        "balance": float(student.solde_scolarite),
        "balance_label": _format_currency(student.solde_scolarite),
        "is_active": student.is_active,
        "status_label": "Actif" if student.is_active else "Suspendu",
        "enrolled_at": student.enrolled_at,
        "photo_url": _media_url(request, student.photo),
        "gender": "",
        "gender_label": "",
        "age": None,
        "hobbies": "",
        "source": "django_portal",
    }


def _legacy_student_exists(matricule, exclude_matricule=None):
    params = [matricule]
    sql = "SELECT matricule FROM etudiant WHERE matricule = %s"
    if exclude_matricule:
        sql += " AND matricule <> %s"
        params.append(exclude_matricule)

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.fetchone() is not None


def _student_form_options_payload():
    return {
        "formations": [
            {
                "id": formation.id,
                "code": formation.code,
                "name": formation.nom,
            }
            for formation in Filiere.objects.order_by("ordre", "code")
        ],
        "promotions": [
            {
                "id": promotion.id,
                "label": promotion.label,
                "academic_year": promotion.academic_year,
                "formation_id": promotion.formation_id,
                "formation_code": promotion.formation.code,
            }
            for promotion in Promotion.objects.select_related("formation").order_by("-year_start", "label")
        ],
        "countries": [
            {"value": code, "label": label}
            for code, label in Etudiant.PAYS_MEMBRES
        ],
    }


def _build_legacy_students_response(search="", status_filter="", country="", formation=""):
    if status_filter == "inactive":
        return _empty_students_payload("legacy")

    if country and country not in {"EMSP", "LEGACY"}:
        return _empty_students_payload("legacy")

    if formation and "emsp" not in formation.lower() and "legacy" not in formation.lower():
        return _empty_students_payload("legacy")

    sql = "SELECT matricule, nom, sexe, age, contact, hobbies FROM etudiant"
    params = []
    clauses = []

    if search:
        like = f"%{search}%"
        clauses.append(
            "(matricule LIKE %s OR nom LIKE %s OR contact LIKE %s OR hobbies LIKE %s)"
        )
        params.extend([like, like, like, like])

    if clauses:
        sql += " WHERE " + " AND ".join(clauses)

    sql += " ORDER BY nom ASC, matricule ASC"

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    return {
        "dataset_mode": "legacy",
        "summary": {
            "total": len(rows),
            "active": len(rows),
            "inactive": 0,
            "promotions": 1 if rows else 0,
            "outstanding_balance": 0,
        },
        "results": [_serialize_legacy_student(row, index) for index, row in enumerate(rows, start=1)],
    }


def _build_legacy_academic_overview_response():
    legacy_payload = _build_legacy_students_response()
    total_students = legacy_payload["summary"]["total"]

    return {
        "summary": {
            "promotions": 1 if total_students else 0,
            "scheduled_courses": 0,
            "generated_documents": 0,
            "average_score": 0,
        },
        "promotions": [
            {
                "id": 1,
                "label": "Cohorte EMSP",
                "academic_year": "",
                "formation_name": "Base etudiant EMSP",
                "formation_code": "EMSP",
                "students_count": total_students,
            }
        ]
        if total_students
        else [],
        "upcoming_courses": [],
        "recent_documents": [],
        "top_students": [],
    }


class MeProfileApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        serializer = EtudiantSerializer(student, context={"request": request})
        return Response(serializer.data)


class MeDashboardApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        notes = list(student.notes.all())
        moyenne = _weighted_average(notes)

        semester_groups = defaultdict(list)
        for note in notes:
            semester_groups[f"{note.annee_academique}-{note.semestre}"].append(note)

        trend = []
        for key in sorted(semester_groups.keys()):
            semester_notes = semester_groups[key]
            trend.append(
                {
                    "label": key,
                    "average": float(_weighted_average(semester_notes)),
                }
            )

        upcoming_exam = (
            EmploiDuTempsItem.objects.filter(
                promotion=student.promotion,
                type="examen",
                debut__gte=timezone.now(),
            )
            .order_by("debut")
            .first()
        )
        if not upcoming_exam:
            upcoming_exam = (
                EmploiDuTempsItem.objects.filter(promotion=student.promotion).order_by("debut").first()
            )

        courses_qs = EmploiDuTempsItem.objects.filter(promotion=student.promotion).order_by("debut")[:3]
        news_qs = Article.objects.filter(is_published=True).select_related("cover")[:2]

        data = {
            "moyenne_generale": float(moyenne),
            "rang_promotion": student.rang_promotion,
            "prochain_examen": upcoming_exam.debut.strftime("%d/%m/%Y %H:%M") if upcoming_exam else "",
            "solde_scolarite": f"{student.solde_scolarite:,.0f} FCFA".replace(",", " "),
            "trend": trend,
            "prochains_cours": EmploiDuTempsSerializer(courses_qs, many=True).data,
            "actualites": ArticleListSerializer(news_qs, many=True, context={"request": request}).data,
        }
        return Response(data)


class MeNotesApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        grouped = defaultdict(list)

        for note in student.notes.all():
            grouped[(note.annee_academique, note.semestre)].append(note)

        payload = []
        for academic_year, semester in sorted(grouped.keys()):
            rows = grouped[(academic_year, semester)]
            credits = sum(row.credits for row in rows if row.note >= 10)
            average = _weighted_average(rows)
            payload.append(
                {
                    "key": f"{academic_year}-{semester}",
                    "label": f"{semester} - {academic_year}",
                    "semester": semester,
                    "academic_year": academic_year,
                    "rows": NoteSerializer(rows, many=True).data,
                    "totals": {
                        "average": float(average),
                        "credits": credits,
                        "result": "Admis" if average >= 10 else "Ajourne",
                    },
                    "download_url": "",
                }
            )

        return Response(payload)


class MeEdtApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        queryset = EmploiDuTempsItem.objects.filter(promotion=student.promotion).order_by("debut")

        limit = request.query_params.get("limit")
        if limit:
            try:
                queryset = queryset[: max(1, int(limit))]
            except ValueError:
                pass

        serializer = EmploiDuTempsSerializer(queryset, many=True)
        return Response(serializer.data)


class MeDocumentsApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        serializer = StudentDocumentSerializer(student.documents.all(), many=True, context={"request": request})
        return Response(serializer.data)


class MeForumApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        discussions = ForumPost.objects.select_related("author").all()
        categories = []
        for key, label in ForumPost.CATEGORY_CHOICES:
            categories.append(
                {
                    "key": key,
                    "label": label,
                    "count": discussions.filter(category=key).count(),
                }
            )

        return Response(
            {
                "categories": categories,
                "discussions": ForumPostSerializer(discussions, many=True).data,
            }
        )

    def post(self, request):
        ensure_portal_demo_data()
        serializer = ForumCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = ForumPost.objects.create(author=request.user, **serializer.validated_data)
        return Response(ForumPostSerializer(post).data, status=status.HTTP_201_CREATED)


class AdminStudentOptionsApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        ensure_portal_demo_data()
        return Response(_student_form_options_payload())


class MeTransportOverviewApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        cars = TransportCar.objects.filter(is_active=True).order_by("label")
        communes = TransportCommune.objects.filter(is_active=True).order_by("label")
        payments = TransportPayment.objects.select_related("car").filter(etudiant=student)
        annual_total = _sum_decimal(payments.filter(year=timezone.localdate().year), "tarif")
        return Response(
            {
                "cars": TransportCarSerializer(cars, many=True).data,
                "communes": TransportCommuneSerializer(communes, many=True).data,
                "payments": TransportPaymentSerializer(payments, many=True).data,
                "annual_total": float(annual_total),
            }
        )


class MeTransportCarWriteSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=120)
    places = serializers.IntegerField(required=False, min_value=0, default=0)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_label(self, value):
        cleaned = " ".join((value or "").split())
        if not cleaned:
            raise serializers.ValidationError("Libelle obligatoire.")
        return cleaned


class MeTransportCarsApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        cars = TransportCar.objects.all().order_by("label")
        return Response(TransportCarSerializer(cars, many=True).data)

    def post(self, request):
        serializer = MeTransportCarWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        car = TransportCar.objects.create(**serializer.validated_data)
        return Response(TransportCarSerializer(car).data, status=status.HTTP_201_CREATED)


class MeTransportCarDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def delete(self, request, pk):
        car = TransportCar.objects.filter(pk=pk).first()
        if car is None:
            raise NotFound("Car introuvable.")
        car.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeTransportPaymentWriteSerializer(serializers.Serializer):
    car_id = serializers.IntegerField(required=False, allow_null=True)
    commune_id = serializers.IntegerField(required=False, allow_null=True)
    tarif = serializers.DecimalField(max_digits=12, decimal_places=2)
    month = serializers.IntegerField(required=False, min_value=1, max_value=12)
    year = serializers.IntegerField(required=False, min_value=2000, max_value=2200)
    operateur = serializers.CharField(max_length=20, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    expires_at = serializers.DateField(required=False, allow_null=True)
    reference = serializers.CharField(max_length=60, required=False, allow_blank=True)

    def validate(self, attrs):
        car = None
        car_id = attrs.get("car_id")
        if car_id:
            car = TransportCar.objects.filter(pk=car_id).first()
            if car is None:
                raise serializers.ValidationError({"car_id": "Car introuvable."})
        if car is None:
            car = TransportCar.objects.filter(is_active=True).first()
        if car is None:
            raise serializers.ValidationError({"car_id": "Aucun car actif n'est configure."})

        commune = None
        commune_id = attrs.get("commune_id")
        if commune_id:
            commune = TransportCommune.objects.filter(pk=commune_id).first()
            if commune is None:
                raise serializers.ValidationError({"commune_id": "Commune introuvable."})

        attrs["car"] = car
        attrs["commune"] = commune
        attrs["month"] = attrs.get("month") or timezone.localdate().month
        attrs["year"] = attrs.get("year") or timezone.localdate().year
        return attrs


class MeTransportPaymentsApiView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        ensure_portal_demo_data()
        student = _student_for_user(request.user)
        serializer = MeTransportPaymentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        payment = TransportPayment.objects.create(
            etudiant=student,
            car=payload["car"],
            commune=payload.get("commune"),
            tarif=payload["tarif"],
            month=payload["month"],
            year=payload["year"],
            operateur=payload.get("operateur", ""),
            phone_number=payload.get("phone", ""),
            expires_at=payload.get("expires_at"),
            reference=payload.get("reference", "") or f"TR-{timezone.now().strftime('%Y%m%d%H%M%S')}",
        )
        return Response(TransportPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class AdminTransportOverviewApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        current_year = timezone.localdate().year
        payments = TransportPayment.objects.select_related("etudiant__user", "car", "commune")
        paid_month = payments.filter(year=current_year, month=timezone.localdate().month)
        return Response(
            {
                "summary": {
                    "cars": TransportCar.objects.count(),
                    "communes": TransportCommune.objects.count(),
                    "routes": TransportRoute.objects.count(),
                    "drivers": TransportDriver.objects.filter(is_active=True).count(),
                    "paid_this_month": float(_sum_decimal(paid_month, "tarif")),
                    "paid_this_year": float(_sum_decimal(payments.filter(year=current_year), "tarif")),
                },
                "depots": TransportDepotSerializer(TransportDepot.objects.all(), many=True).data,
                "communes": TransportCommuneSerializer(TransportCommune.objects.all(), many=True).data,
                "routes": TransportRouteSerializer(TransportRoute.objects.select_related("origin"), many=True).data,
                "cars": TransportCarSerializer(
                    TransportCar.objects.select_related("depot", "route").all(),
                    many=True,
                ).data,
                "drivers": TransportDriverSerializer(
                    TransportDriver.objects.select_related("user", "car").all(),
                    many=True,
                ).data,
                "trips": TransportTripSerializer(
                    TransportTrip.objects.select_related("driver__user", "car", "route")[:30],
                    many=True,
                ).data,
                "payments": TransportPaymentSerializer(payments.order_by("-paid_at")[:100], many=True).data,
            }
        )


class AdminTransportSimpleModelApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]
    model = None
    serializer_class = None
    create_fields = []

    def get_queryset(self):
        queryset = self.model.objects.all()
        if self.model is TransportRoute:
            queryset = queryset.select_related("origin")
        if self.model is TransportCar:
            queryset = queryset.select_related("depot", "route")
        if self.model is TransportDriver:
            queryset = queryset.select_related("user", "car")
        return queryset

    def get(self, request):
        return Response(self.serializer_class(self.get_queryset(), many=True).data)

    def post(self, request):
        payload = {field: request.data.get(field) for field in self.create_fields if field in request.data}
        obj = self.model.objects.create(**payload)
        return Response(self.serializer_class(obj).data, status=status.HTTP_201_CREATED)


class AdminTransportDepotApiView(AdminTransportSimpleModelApiView):
    model = TransportDepot
    serializer_class = TransportDepotSerializer
    create_fields = ["label", "commune", "address", "manager_phone", "is_active"]


class AdminTransportCommuneApiView(AdminTransportSimpleModelApiView):
    model = TransportCommune
    serializer_class = TransportCommuneSerializer
    create_fields = ["label", "pickup_point", "monthly_fee", "is_active"]


class AdminTransportRouteApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        return Response(TransportRouteSerializer(TransportRoute.objects.select_related("origin"), many=True).data)

    def post(self, request):
        origin = TransportCommune.objects.filter(pk=request.data.get("origin")).first()
        if origin is None:
            raise serializers.ValidationError({"origin": "Commune de depart introuvable."})
        route = TransportRoute.objects.create(
            label=request.data.get("label") or f"{origin.label} - EMSP",
            origin=origin,
            destination=request.data.get("destination") or "EMSP",
            pickup_time=request.data.get("pickup_time") or None,
            distance_km=request.data.get("distance_km") or Decimal("0.00"),
            is_active=request.data.get("is_active", True),
        )
        return Response(TransportRouteSerializer(route).data, status=status.HTTP_201_CREATED)


class AdminTransportCarApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        return Response(
            TransportCarSerializer(TransportCar.objects.select_related("depot", "route"), many=True).data
        )

    def post(self, request):
        car = TransportCar.objects.create(
            label=request.data.get("label") or "Car",
            plate_number=request.data.get("plate_number", ""),
            places=request.data.get("places") or 0,
            depot_id=request.data.get("depot") or None,
            route_id=request.data.get("route") or None,
            description=request.data.get("description", ""),
            is_active=request.data.get("is_active", True),
        )
        return Response(TransportCarSerializer(car).data, status=status.HTTP_201_CREATED)


class AdminTransportCarDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def delete(self, request, pk):
        car = TransportCar.objects.filter(pk=pk).first()
        if car is None:
            raise NotFound("Car introuvable.")
        car.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminTransportDriverApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        return Response(TransportDriverSerializer(TransportDriver.objects.select_related("user", "car"), many=True).data)

    def post(self, request):
        email = str(request.data.get("email") or "").strip().lower()
        full_name = " ".join(str(request.data.get("full_name") or "").split())
        if not email or not full_name:
            raise serializers.ValidationError({"detail": "Nom complet et email obligatoires."})
        first_name, *rest = full_name.split(" ")
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": first_name,
                "last_name": " ".join(rest),
                "role": "chauffeur",
                "phone": request.data.get("phone", ""),
            },
        )
        if created:
            user.set_password(request.data.get("password") or "chauffeur12345")
            user.save()
        else:
            user.role = "chauffeur"
            user.first_name = first_name
            user.last_name = " ".join(rest)
            user.phone = request.data.get("phone", user.phone)
            user.save()
        driver, _ = TransportDriver.objects.update_or_create(
            user=user,
            defaults={
                "car_id": request.data.get("car") or None,
                "phone": request.data.get("phone", ""),
                "license_number": request.data.get("license_number", ""),
                "is_active": request.data.get("is_active", True),
            },
        )
        return Response(TransportDriverSerializer(driver).data, status=status.HTTP_201_CREATED)


class DriverTripApiView(APIView):
    permission_classes = [IsAuthenticated, IsDriver]

    def get_driver(self, request):
        driver = TransportDriver.objects.select_related("car", "car__route").filter(user=request.user).first()
        if driver is None:
            raise NotFound("Aucun profil chauffeur n'est lie a ce compte.")
        return driver

    def get(self, request):
        driver = self.get_driver(request)
        trips = TransportTrip.objects.select_related("driver__user", "car", "route").filter(driver=driver)
        return Response({"driver": TransportDriverSerializer(driver).data, "trips": TransportTripSerializer(trips, many=True).data})

    def post(self, request):
        driver = self.get_driver(request)
        car = driver.car
        if car is None:
            raise serializers.ValidationError({"car": "Aucun car n'est affecte a ce chauffeur."})
        service_date = request.data.get("service_date") or timezone.localdate()
        trip, _ = TransportTrip.objects.update_or_create(
            driver=driver,
            car=car,
            service_date=service_date,
            defaults={
                "route": car.route,
                "departure_time": request.data.get("departure_time") or None,
                "arrival_time": request.data.get("arrival_time") or None,
                "notes": request.data.get("notes", ""),
            },
        )
        return Response(TransportTripSerializer(trip).data, status=status.HTTP_201_CREATED)


class AdminDashboardApiView(APIView):
    permission_classes = [IsAuthenticated, IsFullAdminAccess]

    def get(self, request):
        if _table_exists("etudiant"):
            legacy_payload = _build_legacy_students_response()
            total_students = legacy_payload["summary"]["total"]
            current_year = timezone.now().year

            latest_inscriptions = [
                {
                    "id": item["id"],
                    "name": item["full_name"],
                    "country": item["country_label"],
                    "formation": item["formation_name"],
                    "date": "",
                    "status": item["status_label"],
                    "matricule": item["matricule"],
                    "photo_url": item["photo_url"],
                }
                for item in legacy_payload["results"][:5]
            ]

            return Response(
                {
                    "kpis": {
                        "total_students": total_students,
                        "recovery_rate": 0,
                        "success_rate": 0,
                        "pending_applications": Candidature.objects.filter(status__in=["submitted", "under_review"]).count(),
                    },
                    "country_distribution": [{"pays": "Base EMSP", "total": total_students}] if total_students else [],
                    "formation_distribution": [{"formation__nom": "Base etudiant EMSP", "total": total_students}] if total_students else [],
                    "yearly_enrolments": [
                        {"year": str(current_year - 1), "total": 0},
                        {"year": str(current_year), "total": total_students},
                    ],
                    "monthly_finance": [
                        {"label": "Jan", "paid": 0, "due": 0},
                        {"label": "Fev", "paid": 0, "due": 0},
                        {"label": "Mar", "paid": 0, "due": 0},
                        {"label": "Avr", "paid": 0, "due": 0},
                        {"label": "Mai", "paid": 0, "due": 0},
                        {"label": "Juin", "paid": 0, "due": 0},
                    ],
                    "latest_inscriptions": latest_inscriptions,
                }
            )

        ensure_portal_demo_data()

        students_queryset = Etudiant.objects.select_related("formation", "user", "photo")
        payments = Paiement.objects.all()

        total_students = students_queryset.count()
        paid_amount = payments.filter(statut="confirmed").aggregate(total=Sum("montant"))["total"] or Decimal("0.00")
        due_amount = students_queryset.aggregate(total=Sum("solde_scolarite"))["total"] or Decimal("0.00")
        recovery_rate = float((paid_amount / (paid_amount + due_amount) * 100) if (paid_amount + due_amount) else 0)

        scored_students = (
            students_queryset.annotate(
                weighted_score=Sum(
                    ExpressionWrapper(
                        F("notes__note") * F("notes__coefficient"),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    )
                ),
                total_coeff=Sum("notes__coefficient", output_field=DecimalField(max_digits=12, decimal_places=2)),
            )
            .annotate(
                average_score=Case(
                    When(
                        total_coeff__gt=0,
                        then=ExpressionWrapper(
                            F("weighted_score") / F("total_coeff"),
                            output_field=DecimalField(max_digits=7, decimal_places=2),
                        ),
                    ),
                    default=Value(None),
                    output_field=DecimalField(max_digits=7, decimal_places=2),
                )
            )
            .exclude(average_score__isnull=True)
        )
        scored_count = scored_students.count()
        success_rate = round(scored_students.filter(average_score__gte=Decimal("10.00")).count() / scored_count * 100, 2) if scored_count else 0.0

        pending_applications = Candidature.objects.filter(status__in=["submitted", "under_review"]).count()

        country_data = list(students_queryset.values("pays").annotate(total=Count("id")).order_by("pays"))
        formation_data = list(students_queryset.values("formation__nom").annotate(total=Count("id")).order_by("-total"))
        monthly_finance = []
        for index in range(1, 7):
            paid = payments.filter(created_at__month=index, statut="confirmed").aggregate(total=Sum("montant"))["total"] or Decimal("0.00")
            monthly_finance.append(
                {
                    "label": f"M{index}",
                    "paid": float(paid),
                    "due": float(max(due_amount / Decimal("6"), Decimal("0.00"))),
                }
            )

        recent_students = students_queryset.order_by("-enrolled_at")[:5]
        if recent_students:
            latest_inscriptions = [
                {
                    "id": item.id,
                    "name": item.user.full_name,
                    "country": item.pays,
                    "formation": item.formation.nom,
                    "date": item.enrolled_at.strftime("%d/%m/%Y"),
                    "status": "Actif" if item.is_active else "Suspendu",
                    "matricule": item.matricule,
                    "photo_url": item.photo.url if item.photo else "",
                }
                for item in recent_students
            ]
        else:
            latest_inscriptions = []

        current_year = timezone.now().year
        evolution = [
            {"year": str(current_year - 3), "total": 0},
            {"year": str(current_year - 2), "total": 0},
            {"year": str(current_year - 1), "total": 0},
            {"year": str(current_year), "total": total_students},
        ]

        return Response(
            {
                "kpis": {
                    "total_students": total_students,
                    "recovery_rate": round(recovery_rate, 2),
                    "success_rate": success_rate,
                    "pending_applications": pending_applications,
                },
                "country_distribution": country_data,
                "formation_distribution": formation_data,
                "yearly_enrolments": evolution,
                "monthly_finance": monthly_finance,
                "latest_inscriptions": latest_inscriptions,
            }
        )


class AdminStudentListApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "").strip().lower()
        country = request.query_params.get("country", "").strip().upper()
        formation = request.query_params.get("formation", "").strip()

        if _table_exists("etudiant"):
            return Response(
                _build_legacy_students_response(
                    search=search,
                    status_filter=status_filter,
                    country=country,
                    formation=formation,
                )
            )

        ensure_portal_demo_data()

        queryset = Etudiant.objects.select_related("user", "formation", "promotion", "photo")

        if search:
            queryset = queryset.filter(
                Q(matricule__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
            )
        if status_filter == "active":
            queryset = queryset.filter(is_active=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(is_active=False)
        if country:
            queryset = queryset.filter(pays__iexact=country)
        if formation:
            queryset = queryset.filter(
                Q(formation__code__iexact=formation)
                | Q(formation__nom__icontains=formation)
            )

        students = list(queryset.order_by("user__last_name", "user__first_name"))
        outstanding_balance = sum(student.solde_scolarite for student in students)

        return Response(
            {
                "dataset_mode": "portal",
                "summary": {
                    "total": len(students),
                    "active": len([student for student in students if student.is_active]),
                    "inactive": len([student for student in students if not student.is_active]),
                    "promotions": len({student.promotion_id for student in students if student.promotion_id}),
                    "outstanding_balance": float(outstanding_balance),
                },
                "results": [_serialize_portal_student(request, student) for student in students],
            }
        )

    def post(self, request):
        if _table_exists("etudiant"):
            serializer = LegacyStudentWriteSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            payload = serializer.validated_data

            if _legacy_student_exists(payload["matricule"]):
                raise serializers.ValidationError(
                    {"matricule": "Ce matricule existe deja dans la base legacy."}
                )

            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO etudiant (matricule, nom, sexe, age, contact, hobbies)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    [
                        payload["matricule"],
                        payload["full_name"],
                        payload.get("gender", ""),
                        payload.get("age"),
                        payload.get("phone", ""),
                        payload.get("hobbies", ""),
                    ],
                )

            return Response(
                {
                    "detail": "Etudiant ajoute avec succes dans la base legacy.",
                    "student": {
                        "matricule": payload["matricule"],
                        "full_name": payload["full_name"],
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        ensure_portal_demo_data()
        serializer = PortalStudentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        with transaction.atomic():
            user = User(
                username=payload["username"],
                email=payload["email"],
                first_name=payload["first_name"],
                last_name=payload["last_name"],
                role="etudiant",
                phone=payload.get("phone", ""),
            )
            user.set_password(payload["password"])
            user.save()

            student = Etudiant.objects.create(
                user=user,
                matricule=payload["matricule"],
                formation=payload["formation"],
                promotion=payload["promotion"],
                pays=payload["pays"],
                date_naissance=payload.get("date_naissance"),
                lieu_naissance=payload.get("lieu_naissance", ""),
                rang_promotion=payload.get("rang_promotion", 1),
                solde_scolarite=payload.get("solde_scolarite", Decimal("0.00")),
                is_active=payload.get("is_active", True),
            )

        return Response(
            {
                "detail": "Etudiant ajoute avec succes.",
                "initial_password": payload["password"],
                "student": _serialize_portal_student(request, student),
            },
            status=status.HTTP_201_CREATED,
        )


class AdminLegacyStudentDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def patch(self, request, matricule):
        if not _table_exists("etudiant"):
            raise NotFound("La table legacy `etudiant` n'est pas disponible.")

        current_matricule = matricule.strip().upper()
        if not _legacy_student_exists(current_matricule):
            raise NotFound("Cet etudiant legacy est introuvable.")

        serializer = LegacyStudentWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if payload["matricule"] != current_matricule and _legacy_student_exists(
            payload["matricule"],
            exclude_matricule=current_matricule,
        ):
            raise serializers.ValidationError(
                {"matricule": "Ce matricule existe deja dans la base legacy."}
            )

        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE etudiant
                SET matricule = %s, nom = %s, sexe = %s, age = %s, contact = %s, hobbies = %s
                WHERE matricule = %s
                """,
                [
                    payload["matricule"],
                    payload["full_name"],
                    payload.get("gender", ""),
                    payload.get("age"),
                    payload.get("phone", ""),
                    payload.get("hobbies", ""),
                    current_matricule,
                ],
            )

        return Response(
            {
                "detail": "Etudiant legacy mis a jour avec succes.",
                "student": {
                    "matricule": payload["matricule"],
                    "full_name": payload["full_name"],
                },
            }
        )


class AdminPortalStudentDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get_object(self, pk):
        ensure_portal_demo_data()
        student = (
            Etudiant.objects.select_related("user", "formation", "promotion", "photo")
            .filter(pk=pk)
            .first()
        )
        if student is None:
            raise NotFound("Cet etudiant est introuvable.")
        return student

    def patch(self, request, pk):
        student = self.get_object(pk)
        serializer = PortalStudentWriteSerializer(
            data=request.data,
            context={"student": student},
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        with transaction.atomic():
            user = student.user
            user.username = payload["username"]
            user.email = payload["email"]
            user.first_name = payload["first_name"]
            user.last_name = payload["last_name"]
            user.phone = payload.get("phone", "")
            if str(request.data.get("password", "")).strip():
                user.set_password(payload["password"])
            user.save()

            student.matricule = payload["matricule"]
            student.formation = payload["formation"]
            student.promotion = payload["promotion"]
            student.pays = payload["pays"]
            student.date_naissance = payload.get("date_naissance")
            student.lieu_naissance = payload.get("lieu_naissance", "")
            student.rang_promotion = payload.get("rang_promotion", 1)
            student.solde_scolarite = payload.get("solde_scolarite", Decimal("0.00"))
            student.is_active = payload.get("is_active", True)
            student.save()

        return Response(
            {
                "detail": "Etudiant mis a jour avec succes.",
                "student": _serialize_portal_student(request, student),
            }
        )


class DashboardPromotionListCreateApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        queryset = (
            Promotion.objects.select_related("formation")
            .annotate(etudiants_count=Count("etudiants"))
            .order_by("-year_start", "label")
        )
        return Response(_paginated_payload(request, queryset, DashboardPromotionSerializer))

    def post(self, request):
        serializer = DashboardPromotionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        promotion = Promotion.objects.create(
            label=payload["label"],
            formation=payload["formation_obj"],
            year_start=payload["year_start"],
            year_end=payload["year_end"],
        )
        return Response(DashboardPromotionSerializer(promotion).data, status=status.HTTP_201_CREATED)


class DashboardPromotionDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get_object(self, pk):
        promotion = (
            Promotion.objects.select_related("formation")
            .annotate(etudiants_count=Count("etudiants"))
            .filter(pk=pk)
            .first()
        )
        if promotion is None:
            raise NotFound("Promotion introuvable.")
        return promotion

    def get(self, request, pk):
        return Response(DashboardPromotionSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        promotion = self.get_object(pk)
        serializer = DashboardPromotionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        promotion.label = payload["label"]
        promotion.formation = payload["formation_obj"]
        promotion.year_start = payload["year_start"]
        promotion.year_end = payload["year_end"]
        promotion.save()
        return Response(DashboardPromotionSerializer(promotion).data)

    def delete(self, request, pk):
        promotion = self.get_object(pk)
        promotion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DashboardEmploiDuTempsListCreateApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        queryset = EmploiDuTempsItem.objects.select_related("promotion", "promotion__formation").order_by("debut")
        return Response(_paginated_payload(request, queryset, DashboardEmploiDuTempsSerializer))

    def post(self, request):
        serializer = DashboardEmploiDuTempsWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        item = EmploiDuTempsItem.objects.create(
            promotion=payload["promotion_obj"],
            matiere=payload["matiere"],
            enseignant=payload.get("enseignant", ""),
            salle=payload.get("salle", ""),
            type=payload["type"],
            debut=payload["debut"],
            fin=payload["fin"],
        )
        return Response(DashboardEmploiDuTempsSerializer(item).data, status=status.HTTP_201_CREATED)


class DashboardEmploiDuTempsDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get_object(self, pk):
        item = EmploiDuTempsItem.objects.select_related("promotion", "promotion__formation").filter(pk=pk).first()
        if item is None:
            raise NotFound("Creneau introuvable.")
        return item

    def get(self, request, pk):
        return Response(DashboardEmploiDuTempsSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        item = self.get_object(pk)
        serializer = DashboardEmploiDuTempsWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        item.promotion = payload["promotion_obj"]
        item.matiere = payload["matiere"]
        item.enseignant = payload.get("enseignant", "")
        item.salle = payload.get("salle", "")
        item.type = payload["type"]
        item.debut = payload["debut"]
        item.fin = payload["fin"]
        item.save()
        return Response(DashboardEmploiDuTempsSerializer(item).data)

    def delete(self, request, pk):
        self.get_object(pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAcademicOverviewApiView(APIView):
    permission_classes = [IsAuthenticated, IsAdminFamily]

    def get(self, request):
        if _table_exists("etudiant"):
            return Response(_build_legacy_academic_overview_response())

        ensure_portal_demo_data()

        promotions = (
            Promotion.objects.select_related("formation")
            .annotate(students_count=Count("etudiants"))
            .order_by("-year_start", "label")
        )
        upcoming_courses = (
            EmploiDuTempsItem.objects.select_related("promotion", "promotion__formation")
            .order_by("debut")[:8]
        )
        recent_documents = (
            StudentDocument.objects.select_related("etudiant__user", "etudiant__formation", "etudiant__promotion")
            .order_by("-is_generated", "-generated_at", "-id")[:8]
        )

        students = list(
            Etudiant.objects.select_related("user", "formation", "promotion").prefetch_related("notes")
        )
        top_students = []
        averages = []
        for student in students:
            average = float(_weighted_average(list(student.notes.all())))
            if average <= 0:
                continue
            averages.append(average)
            top_students.append(
                {
                    "id": student.id,
                    "full_name": student.user.full_name,
                    "matricule": student.matricule,
                    "formation_name": student.formation.nom,
                    "promotion_label": student.promotion.label if student.promotion else "",
                    "rank": student.rang_promotion,
                    "average": round(average, 2),
                }
            )

        top_students = sorted(top_students, key=lambda item: item["average"], reverse=True)[:5]

        return Response(
            {
                "summary": {
                    "promotions": promotions.count(),
                    "scheduled_courses": EmploiDuTempsItem.objects.count(),
                    "generated_documents": StudentDocument.objects.filter(is_generated=True).count(),
                    "average_score": round(sum(averages) / len(averages), 2) if averages else 0,
                },
                "promotions": [
                    {
                        "id": promotion.id,
                        "label": promotion.label,
                        "academic_year": promotion.academic_year,
                        "formation_name": promotion.formation.nom,
                        "formation_code": promotion.formation.code,
                        "students_count": promotion.students_count,
                    }
                    for promotion in promotions
                ],
                "upcoming_courses": [
                    {
                        "id": course.id,
                        "matiere": course.matiere,
                        "enseignant": course.enseignant,
                        "salle": course.salle,
                        "type": course.type,
                        "debut": course.debut,
                        "fin": course.fin,
                        "promotion_label": course.promotion.label,
                        "formation_name": course.promotion.formation.nom,
                    }
                    for course in upcoming_courses
                ],
                "recent_documents": [
                    {
                        "id": document.id,
                        "title": document.title,
                        "type_document": document.type_document,
                        "semester": document.semester,
                        "academic_year": document.academic_year,
                        "is_generated": document.is_generated,
                        "generated_at": document.generated_at,
                        "student_name": document.etudiant.user.full_name,
                        "matricule": document.etudiant.matricule,
                        "promotion_label": document.etudiant.promotion.label if document.etudiant.promotion else "",
                    }
                    for document in recent_documents
                ],
                "top_students": top_students,
            }
        )


class AdminEnseignantWriteSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    specialite = serializers.CharField(max_length=200, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    statut = serializers.ChoiceField(
        choices=[choice[0] for choice in Enseignant.STATUS_CHOICES],
        required=False,
        default="disponible",
    )
    disponibilite = serializers.CharField(max_length=255, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_full_name(self, value):
        cleaned = " ".join((value or "").split())
        if not cleaned:
            raise serializers.ValidationError("Nom complet obligatoire.")
        return cleaned


class AdminEnseignantListCreateApiView(APIView):
    permission_classes = [IsAuthenticated, IsFullAdminAccess]

    def get(self, request):
        ensure_portal_demo_data()
        queryset = Enseignant.objects.all()
        return Response(EnseignantSerializer(queryset, many=True).data)

    def post(self, request):
        ensure_portal_demo_data()
        serializer = AdminEnseignantWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = Enseignant.objects.create(**serializer.validated_data)
        return Response(EnseignantSerializer(teacher).data, status=status.HTTP_201_CREATED)


class AdminEnseignantDetailApiView(APIView):
    permission_classes = [IsAuthenticated, IsFullAdminAccess]

    def delete(self, request, pk):
        ensure_portal_demo_data()
        teacher = Enseignant.objects.filter(pk=pk).first()
        if teacher is None:
            raise NotFound("Enseignant introuvable.")
        teacher.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
