// Language system for Nely Mobile App
// English primary, Bahasa Malaysia secondary

export type Language = 'en' | 'ms';

export interface LanguageTexts {
  // Onboarding Screen
  onboarding: {
    skip: string;
    next: string;
    getStarted: string;
    startCaring: string;
  };

  // Authentication Screen
  auth: {
    welcomeBack: string;
    getStarted: string;
    login: string;
    register: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    password: string;
    confirmPassword: string;
    loginButton: string;
    registerButton: string;
    useDemoAccount: string;
    loginSuccess: string;
    welcomeBack2: string;
    registerSuccess: string;
    welcome: string;
    error: string;
    fillAllFields: string;
    passwordMismatch: string;
    fillEmailPassword: string;
    guestLogin: string;
    useDemo: string;
  };

  // Verification Screen
  verify: {
    title: string;
    subtitle: string;
    emailSent: string;
    verifyButton: string;
    resendCode: string;
    resendIn: string;
    seconds: string;
  };

  // Boarding Screen
  boarding: {
    title: string;
    subtitle: string;
    createOption: string;
    createDescription: string;
    joinOption: string;
    joinDescription: string;
    continueButton: string;
  };

  // Create Family Screen
  createFamily: {
    title: string;
    subtitle: string;
    familyNameLabel: string;
    elderlyNameLabel: string;
    elderlyAgeLabel: string;
    relationshipLabel: string;
    createButton: string;
  };
  
  // Navigation & Screens
  navigation: {
    home: string;
    family: string;
    insights: string;
    profile: string;
  };
  
  // Screen Headers
  screens: {
    homeTitle: string;
    homeSubtitle: string;
    familyTitle: string;
    familySubtitle: string;
    insightsTitle: string;
    insightsSubtitle: string;
    profileTitle: string;
    profileSubtitle: string;
  };
  
  // Health Status
  health: {
    normal: string;
    concerning: string;
    critical: string;
    bloodPressure: string;
    bloodGlucose: string;
    weight: string;
    temperature: string;
    spO2: string;
    pulse: string;
    respiratoryRate: string;
    lastRecorded: string;
    recordedBy: string;
  };
  
  // Family & Relationships
  family: {
    grandmother: string;
    grandfather: string;
    mother: string;
    father: string;
    son: string;
    daughter: string;
    daughterInLaw: string;
    sonInLaw: string;
    grandchild: string;
    primaryCaregiver: string;
    familyMember: string;
  };
  
  // Common
  common: {
    ok: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    add: string;
    view: string;
    back: string;
    next: string;
    done: string;
    loading: string;
  };
}

export const languages: Record<Language, LanguageTexts> = {
  en: {
    onboarding: {
      skip: 'Skip',
      next: 'Next',
      getStarted: 'Get Started',
      startCaring: 'Start Caring Together',
    },
    auth: {
      welcomeBack: 'Welcome back',
      getStarted: 'Let\'s get started together',
      login: 'Login',
      register: 'Register',
      fullName: 'Full name',
      phoneNumber: 'Phone number',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      loginButton: 'Login',
      registerButton: 'Create Account',
      useDemoAccount: 'Use Demo Account',
      loginSuccess: 'Login Successful',
      welcomeBack2: 'Welcome back!',
      registerSuccess: 'Registration Successful',
      welcome: 'Welcome',
      error: 'Error',
      fillAllFields: 'Please fill in all required fields',
      passwordMismatch: 'Passwords do not match',
      fillEmailPassword: 'Please enter email and password',
      guestLogin: 'Login as Guest',
      useDemo: 'You will use a demo account',
    },
    verify: {
      title: 'Email Verification',
      subtitle: 'Enter the 6-digit code we sent to your email',
      emailSent: 'Code sent to',
      verifyButton: 'Verify Email',
      resendCode: 'Resend Code',
      resendIn: 'Resend in',
      seconds: 's',
    },
    boarding: {
      title: 'Family Setup',
      subtitle: 'Choose how you want to start using Nely',
      createOption: 'Create New Family Group',
      createDescription: 'Set up a new family group to start tracking health together',
      joinOption: 'Join Existing Family',
      joinDescription: 'Enter a family code to join an existing group',
      continueButton: 'Continue',
    },
    createFamily: {
      title: 'Create Family Group',
      subtitle: 'Set up your family to start tracking health together',
      familyNameLabel: 'Family Group Name',
      elderlyNameLabel: 'Elderly Person Name',
      elderlyAgeLabel: 'Age',
      relationshipLabel: 'Your relationship to them',
      createButton: 'Create Family Group',
    },
    navigation: {
      home: 'Home',
      family: 'Family',
      insights: 'Insights',
      profile: 'Profile',
    },
    screens: {
      homeTitle: 'Home',
      homeSubtitle: 'Daily health overview and quick actions',
      familyTitle: 'Family',
      familySubtitle: 'Elderly profile and detailed health management',
      insightsTitle: 'Insights',
      insightsSubtitle: 'Health trends and analytics',
      profileTitle: 'Profile',
      profileSubtitle: 'User account and app settings',
    },
    health: {
      normal: 'Normal',
      concerning: 'Concerning',
      critical: 'Critical',
      bloodPressure: 'Blood Pressure',
      bloodGlucose: 'Blood Glucose',
      weight: 'Weight',
      temperature: 'Temperature',
      spO2: 'SpO2',
      pulse: 'Pulse',
      respiratoryRate: 'Respiratory Rate',
      lastRecorded: 'Last recorded',
      recordedBy: 'Recorded by',
    },
    family: {
      grandmother: 'Grandmother',
      grandfather: 'Grandfather',
      mother: 'Mother',
      father: 'Father',
      son: 'Son',
      daughter: 'Daughter',
      daughterInLaw: 'Daughter-in-law',
      sonInLaw: 'Son-in-law',
      grandchild: 'Grandchild',
      primaryCaregiver: 'Primary Caregiver',
      familyMember: 'Family Member',
    },
    common: {
      ok: 'OK',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      view: 'View',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      loading: 'Loading',
    },
  },
  ms: {
    onboarding: {
      skip: 'Langkau',
      next: 'Seterusnya',
      getStarted: 'Mari Bermula',
      startCaring: 'Mula Menjaga Bersama-sama',
    },
    auth: {
      welcomeBack: 'Selamat datang kembali',
      getStarted: 'Mari bermula bersama-sama',
      login: 'Log Masuk',
      register: 'Daftar',
      fullName: 'Nama penuh',
      phoneNumber: 'Nombor telefon',
      email: 'Email',
      password: 'Kata laluan',
      confirmPassword: 'Sahkan kata laluan',
      loginButton: 'Log Masuk',
      registerButton: 'Daftar Akaun',
      useDemoAccount: 'Gunakan Akaun Demo',
      loginSuccess: 'Log Masuk Berjaya',
      welcomeBack2: 'Selamat datang kembali!',
      registerSuccess: 'Pendaftaran Berjaya',
      welcome: 'Selamat datang',
      error: 'Ralat',
      fillAllFields: 'Sila lengkapkan semua maklumat yang diperlukan',
      passwordMismatch: 'Kata laluan tidak sama',
      fillEmailPassword: 'Sila masukkan email dan kata laluan',
      guestLogin: 'Log Masuk Sebagai Tetamu',
      useDemo: 'Anda akan menggunakan akaun demo',
    },
    verify: {
      title: 'Pengesahan Email',
      subtitle: 'Masukkan kod 6-digit yang kami hantar ke email anda',
      emailSent: 'Kod dihantar ke',
      verifyButton: 'Sahkan Email',
      resendCode: 'Hantar Semula Kod',
      resendIn: 'Hantar semula dalam',
      seconds: 's',
    },
    boarding: {
      title: 'Persediaan Keluarga',
      subtitle: 'Pilih cara anda ingin mula menggunakan Nely',
      createOption: 'Buat Kumpulan Keluarga Baru',
      createDescription: 'Sediakan kumpulan keluarga baru untuk mula menjejak kesihatan bersama',
      joinOption: 'Sertai Keluarga Sedia Ada',
      joinDescription: 'Masukkan kod keluarga untuk menyertai kumpulan sedia ada',
      continueButton: 'Teruskan',
    },
    createFamily: {
      title: 'Buat Kumpulan Keluarga',
      subtitle: 'Sediakan keluarga anda untuk mula menjejak kesihatan bersama',
      familyNameLabel: 'Nama Kumpulan Keluarga',
      elderlyNameLabel: 'Nama Warga Emas',
      elderlyAgeLabel: 'Umur',
      relationshipLabel: 'Hubungan anda dengan mereka',
      createButton: 'Buat Kumpulan Keluarga',
    },
    navigation: {
      home: 'Utama',
      family: 'Keluarga',
      insights: 'Analisis',
      profile: 'Profil',
    },
    screens: {
      homeTitle: 'Utama',
      homeSubtitle: 'Ringkasan kesihatan harian dan tindakan pantas',
      familyTitle: 'Keluarga',
      familySubtitle: 'Profil warga emas dan pengurusan kesihatan terperinci',
      insightsTitle: 'Analisis',
      insightsSubtitle: 'Trend kesihatan dan analitik',
      profileTitle: 'Profil',
      profileSubtitle: 'Akaun pengguna dan tetapan aplikasi',
    },
    health: {
      normal: 'Normal',
      concerning: 'Membimbangkan',
      critical: 'Kritikal',
      bloodPressure: 'Tekanan Darah',
      bloodGlucose: 'Gula Darah',
      weight: 'Berat Badan',
      temperature: 'Suhu Badan',
      spO2: 'SpO2',
      pulse: 'Nadi',
      respiratoryRate: 'Kadar Pernafasan',
      lastRecorded: 'Dicatat terakhir',
      recordedBy: 'Dicatat oleh',
    },
    family: {
      grandmother: 'Nenek',
      grandfather: 'Atuk',
      mother: 'Ibu',
      father: 'Ayah',
      son: 'Anak lelaki',
      daughter: 'Anak perempuan',
      daughterInLaw: 'Menantu perempuan',
      sonInLaw: 'Menantu lelaki',
      grandchild: 'Cucu',
      primaryCaregiver: 'Penjaga Utama',
      familyMember: 'Ahli Keluarga',
    },
    common: {
      ok: 'OK',
      cancel: 'Batal',
      save: 'Simpan',
      edit: 'Edit',
      delete: 'Padam',
      add: 'Tambah',
      view: 'Lihat',
      back: 'Kembali',
      next: 'Seterusnya',
      done: 'Selesai',
      loading: 'Memuatkan',
    },
  },
};

// Language context hook will be created separately
export const defaultLanguage: Language = 'en'; // English as primary
export const supportedLanguages: Language[] = ['en', 'ms'];