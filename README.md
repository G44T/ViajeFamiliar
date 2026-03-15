# ✈️ FamilyTrip — Divisor de gastos de viaje

React + Vite + Firebase Firestore con sincronización en tiempo real.

## Configuración Firebase (5 pasos)

### 1. Crear proyecto en Firebase Console
- Ve a https://console.firebase.google.com → "Agregar proyecto"

### 2. Activar Firestore
- Build → Firestore Database → "Crear base de datos" → Modo de prueba

### 3. Registrar app web
- Ícono </> → Copiar el objeto firebaseConfig

### 4. Crear archivo .env
cp .env.example .env
# Pega tus valores de Firebase

### 5. Reglas de seguridad Firestore
Pega el contenido de firestore.rules en Firebase Console → Firestore → Reglas

## Desarrollo
npm install
npm run dev

## Build producción
npm run build
