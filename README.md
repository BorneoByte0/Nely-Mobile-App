# 🏥 Nely - Healthcare Management Mobile App

**A comprehensive family healthcare management solution built with React Native & Expo**

![React Native](https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

## 📱 Overview

Nely is a modern, bilingual (English/Malay) healthcare management application designed to help families monitor and care for elderly family members. The app provides comprehensive tools for medication tracking, vital signs monitoring, appointment management, and family coordination.

## ✨ Key Features

### 🏠 **Family Dashboard**
- Real-time health status monitoring
- Family member coordination
- Quick action buttons for common tasks
- Recent activity timeline

### 💊 **Medication Management**
- Smart medication scheduling
- Dosage tracking and reminders
- Prescription management
- Medication history and compliance

### 📊 **Health Monitoring**
- Vital signs tracking (BP, SpO₂, Heart Rate, Temperature)
- Health trends and analytics
- Alert system for concerning readings
- Historical data visualization

### 📝 **Care Notes**
- Family care coordination
- Important observations tracking
- Categorized notes (health, medication, daily care, behavior)
- Real-time family sharing

### 📅 **Appointment Management**
- Healthcare appointment scheduling
- Reminder notifications
- Appointment history
- Provider information management

### 🌏 **Bilingual Support**
- Full English and Malay language support
- Contextual translations
- Cultural considerations for Malaysian healthcare

## 🛠️ Technical Stack

### **Frontend**
- **React Native** with Expo SDK 51
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Linear Gradient** for modern UI
- **React Native Async Storage** for local data

### **Backend & Database**
- **Supabase** for backend services
- **PostgreSQL** database with Row Level Security
- **Real-time subscriptions** for live updates
- **Google OAuth** authentication

### **Development Tools**
- **Expo CLI** for development workflow
- **TypeScript** compilation
- **ESLint** for code quality
- **Git** version control

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio / Xcode (for device testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourUsername/nely-mobile-app.git
   cd nely-mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on device/simulator**
   - Scan QR code with Expo Go app (Android/iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

## 🗄️ Database Setup

### Supabase Configuration

1. Create a new Supabase project
2. Run the migration files in order:
   ```sql
   -- Execute these files in your Supabase SQL editor
   Database/01_create_tables.sql
   Database/02_enable_rls.sql
   Database/03_functions_triggers.sql
   Database/04_sample_data.sql
   Database/05_add_avatar_columns.sql
   Database/06_schema_enhancements.sql
   Database/07_update_care_notes_categories.sql
   ```

3. Configure authentication providers (Google OAuth)
4. Update `.env` with your Supabase credentials

## 📁 Project Structure

```
nely-mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens/pages
│   ├── navigation/         # Navigation configuration
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React Context providers
│   ├── lib/                # Third-party configurations
│   ├── constants/          # App constants
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── assets/                 # Static assets (images, icons)
├── Database/               # Database migration files
├── References/             # Development documentation
└── App.tsx                 # Root component
```

## 🔧 Development Workflow

### Code Quality
- **Zero TypeScript errors** - Complete type safety
- **No mock data dependencies** - Real database integration
- **Comprehensive error handling** - Production-ready patterns
- **Bilingual support** - English/Malay translations

### Development Phases
- ✅ **Phase 1** - Core healthcare database implementation
- ✅ **Phase 2** - Enhanced care notes and UI modernization
- ✅ **Phase 3** - TypeScript error resolution & mock data elimination
- 🔄 **Phase 4** - Performance optimization & advanced features

## 🌟 Key Achievements

### **Production Ready Features**
- **Zero Compilation Errors** - Clean TypeScript codebase
- **Complete Database Integration** - No mock data dependencies
- **Advanced Medication Tracking** - Smart scheduling algorithms
- **Real-time Health Alerts** - Dynamic vital signs monitoring
- **Professional UX** - Modern, accessible interface design

### **Technical Excellence**
- **Type Safety** - Full TypeScript implementation
- **Error Boundaries** - Comprehensive error handling
- **Performance Optimized** - Efficient database queries
- **Security First** - Row Level Security implementation
- **Scalable Architecture** - Modular component design

## 📖 Documentation

Comprehensive development documentation available in the `References/` folder:
- **Development_Progress_1.md** - Initial healthcare database implementation
- **Development_Progress_2.md** - Enhanced care notes and UI improvements
- **Development_Progress_3.md** - TypeScript fixes and code quality enhancements
- **Project_Context.md** - Project overview and requirements
- **User_Flow.md** - Application user experience flow

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team** for the excellent development platform
- **Supabase** for the robust backend infrastructure
- **React Native Community** for the comprehensive ecosystem
- **Healthcare Professionals** for domain expertise and feedback

## 📞 Support

For support, email support@nely-app.com or create an issue in this repository.

---

**Built with ❤️ for Malaysian families by the Nely team**