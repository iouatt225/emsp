from decimal import Decimal

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.actualites.models import Article
from apps.actualites.serializers import ArticleListSerializer
from apps.mediatheque.serializers import MediaItemSerializer

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


class PromotionSerializer(serializers.ModelSerializer):
    academic_year = serializers.CharField(read_only=True)

    class Meta:
        model = Promotion
        fields = ["id", "label", "year_start", "year_end", "academic_year"]


class EtudiantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    photo = MediaItemSerializer(read_only=True)
    formation_name = serializers.CharField(source="formation.nom", read_only=True)
    formation_code = serializers.CharField(source="formation.code", read_only=True)
    promotion = PromotionSerializer(read_only=True)

    class Meta:
        model = Etudiant
        fields = [
            "id",
            "matricule",
            "user",
            "formation_name",
            "formation_code",
            "promotion",
            "pays",
            "photo",
            "rang_promotion",
            "solde_scolarite",
        ]


class NoteSerializer(serializers.ModelSerializer):
    mention = serializers.CharField(read_only=True)
    validation = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id",
            "matiere",
            "coefficient",
            "credits",
            "note",
            "semestre",
            "annee_academique",
            "mention",
            "validation",
        ]

    def get_validation(self, obj):
        return bool(obj.note >= Decimal("10.00"))


class EmploiDuTempsSerializer(serializers.ModelSerializer):
    color = serializers.SerializerMethodField()

    class Meta:
        model = EmploiDuTempsItem
        fields = [
            "id",
            "matiere",
            "enseignant",
            "salle",
            "type",
            "debut",
            "fin",
            "color",
        ]

    def get_color(self, obj):
        return {
            "cours": "#22C55E",
            "td": "#FACC15",
            "examen": "#EF4444",
            "ferie": "#94A3B8",
        }.get(obj.type, "#22C55E")


class StudentDocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentDocument
        fields = [
            "id",
            "title",
            "type_document",
            "semester",
            "academic_year",
            "is_generated",
            "generated_at",
            "download_url",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        if obj.file:
            return obj.file.url
        return ""


class ForumPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = ForumPost
        fields = [
            "id",
            "category",
            "title",
            "content",
            "author_name",
            "replies_count",
            "created_at",
        ]


class EnseignantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enseignant
        fields = [
            "id",
            "full_name",
            "specialite",
            "email",
            "phone",
            "statut",
            "disponibilite",
            "is_active",
            "created_at",
        ]


class TransportDepotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportDepot
        fields = ["id", "label", "commune", "address", "manager_phone", "is_active"]


class TransportCommuneSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportCommune
        fields = ["id", "label", "pickup_point", "monthly_fee", "is_active"]


class TransportRouteSerializer(serializers.ModelSerializer):
    origin_label = serializers.CharField(source="origin.label", read_only=True)

    class Meta:
        model = TransportRoute
        fields = [
            "id",
            "label",
            "origin",
            "origin_label",
            "destination",
            "pickup_time",
            "distance_km",
            "is_active",
        ]


class TransportCarSerializer(serializers.ModelSerializer):
    depot_label = serializers.SerializerMethodField()
    route_label = serializers.SerializerMethodField()

    def get_depot_label(self, obj):
        return obj.depot.label if obj.depot else ""

    def get_route_label(self, obj):
        return obj.route.label if obj.route else ""

    class Meta:
        model = TransportCar
        fields = [
            "id",
            "label",
            "plate_number",
            "places",
            "depot",
            "depot_label",
            "route",
            "route_label",
            "description",
            "is_active",
            "created_at",
        ]


class TransportDriverSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    car_label = serializers.SerializerMethodField()
    route_label = serializers.SerializerMethodField()

    def get_car_label(self, obj):
        return obj.car.label if obj.car else ""

    def get_route_label(self, obj):
        if obj.car and obj.car.route:
            return obj.car.route.label
        return ""

    class Meta:
        model = TransportDriver
        fields = [
            "id",
            "user",
            "full_name",
            "email",
            "car",
            "car_label",
            "route_label",
            "phone",
            "license_number",
            "is_active",
            "created_at",
        ]


class TransportTripSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source="driver.user.full_name", read_only=True)
    car_label = serializers.CharField(source="car.label", read_only=True)
    route_label = serializers.SerializerMethodField()

    def get_route_label(self, obj):
        return obj.route.label if obj.route else ""

    class Meta:
        model = TransportTrip
        fields = [
            "id",
            "driver",
            "driver_name",
            "car",
            "car_label",
            "route",
            "route_label",
            "service_date",
            "departure_time",
            "arrival_time",
            "notes",
            "created_at",
        ]


class TransportPaymentSerializer(serializers.ModelSerializer):
    car = TransportCarSerializer(read_only=True)
    commune_label = serializers.SerializerMethodField()
    student_name = serializers.CharField(source="etudiant.user.full_name", read_only=True)
    matricule = serializers.CharField(source="etudiant.matricule", read_only=True)

    def get_commune_label(self, obj):
        return obj.commune.label if obj.commune else ""

    class Meta:
        model = TransportPayment
        fields = [
            "id",
            "student_name",
            "matricule",
            "car",
            "commune",
            "commune_label",
            "tarif",
            "month",
            "year",
            "operateur",
            "phone_number",
            "paid_at",
            "expires_at",
            "reference",
        ]


class StudentDashboardSerializer(serializers.Serializer):
    moyenne_generale = serializers.FloatField()
    rang_promotion = serializers.IntegerField()
    prochain_examen = serializers.CharField(allow_blank=True)
    solde_scolarite = serializers.CharField()
    trend = serializers.ListField(child=serializers.DictField())
    prochains_cours = EmploiDuTempsSerializer(many=True)
    actualites = ArticleListSerializer(many=True)
