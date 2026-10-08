# Security Specification & Threat Model — TSR Transport

## 1. Data Invariants
1. Un utilisateur ne peut lire ni écrire que ses propres réservations et billets (`/users/{userId}/*`).
2. Les gares (`/stations/*`) et les départs de car (`/trips/*`) sont accessibles en lecture publique pour consultation des horaires.
3. Seul un administrateur identifié peut créer ou modifier les trajets et tarifs des cars.
4. Un utilisateur ne peut pas s'auto-attribuer le rôle d'administrateur ou de contrôleur.
5. Tout identifiant de document doit respecter la règle stricte de taille et d'expression régulière (`^[a-zA-Z0-9_\-]+$`).

## 2. The Dirty Dozen Payloads (Rejetés par les Règles)
1. Création d'une réservation avec un `userId` différent de `request.auth.uid` -> PERMISSION_DENIED.
2. Écriture sans être authentifié sur `/users/{userId}/bookings` -> PERMISSION_DENIED.
3. Modification d'un trajet ou du prix d'un car par un client standard -> PERMISSION_DENIED.
4. Injection d'une chaîne de caractères de plus de 128 caractères comme document ID -> PERMISSION_DENIED.
5. Écriture dans une collection inconnue / non documentée -> Bloquée par la règle par défaut deny-all.
6. Altération du champ `userId` lors d'une mise à jour de réservation -> PERMISSION_DENIED.
7. Lecture de la collection privée d'un autre utilisateur -> PERMISSION_DENIED.
8. Injection de champs fantômes (shadow fields) non autorisés -> PERMISSION_DENIED.
9. Création d'une alerte de fraude avec sévérité invalide -> PERMISSION_DENIED.
10. Écriture de timestamp client non synchronisé avec le serveur -> PERMISSION_DENIED.
11. Tentative de suppression d'une gare par un utilisateur anonyme -> PERMISSION_DENIED.
12. Lecture en liste sans filtre de propriété sur les réservations -> PERMISSION_DENIED.
