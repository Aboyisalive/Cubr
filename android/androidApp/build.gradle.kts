plugins {
    // AGP 9 has Kotlin support built in; org.jetbrains.kotlin.android
    // must NOT be applied anymore.
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.kotlinComposeCompiler)
}

android {
    namespace = "com.cubr.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.cubr.app"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    implementation(project(":composeApp"))
    implementation(libs.androidx.activity.compose)
}
