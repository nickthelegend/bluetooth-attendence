"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  View,
  Keyboard,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { StatusBar } from "expo-status-bar"
import { BlurView } from "expo-blur"

import { ThemedText } from "@/components/ThemedText"
import { IconSymbol } from "@/components/ui/IconSymbol"

// Initialize Supabase client
const supabaseUrl = 'https://oquvqaiisiilhbvoopoi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdXZxYWlpc2lpbGhidm9vcG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjcwNDksImV4cCI6MjA2MDE0MzA0OX0.XZT2SaLizGo8LWuFv3zRjHwuF-dzsSzCrKFNKuYe8Xs'


const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

const { width, height } = Dimensions.get("window")

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is already logged in, redirect to tabs
        router.replace("/(tabs)")
      }
    })
  }, [])

  useEffect(() => {
    const keyboardDidShowListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillShow", () => setKeyboardVisible(true))
        : Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true))

    const keyboardDidHideListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => setKeyboardVisible(false))
        : Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false))

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const validateForm = () => {
    let isValid = true
    setEmailError("")
    setPasswordError("")
    setGeneralError("")

    if (!email) {
      setEmailError("Email is required")
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address")
      isValid = false
    }

    if (!password) {
      setPasswordError("Password is required")
      isValid = false
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      isValid = false
    }

    return isValid
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login")) {
          setGeneralError("Invalid email or password")
        } else {
          setGeneralError(error.message)
        }
      } else {
        // Navigate to the main app
        router.replace("/(tabs)")
      }
    } catch (error) {
      setGeneralError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // For demo purposes - quick login without authentication
  const handleDemoLogin = () => {
    router.replace("/(tabs)")
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#4776E6", "#8E54E9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.backgroundCircle1} />
        <View style={styles.backgroundCircle2} />

        <View style={styles.logoContainer}>
          <IconSymbol size={60} name="building.columns.fill" color="#ffffff" style={styles.logoIcon} />
          <ThemedText style={styles.logoText}>Staff Attendance</ThemedText>
          <ThemedText style={styles.logoSubText}>Management System</ThemedText>
        </View>

        <BlurView intensity={30} tint="light" style={styles.formContainer}>
          <ThemedText style={styles.title}>Welcome Back</ThemedText>
          <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>

          {generalError ? (
            <View style={styles.errorContainer}>
              <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#FF3B30" />
              <ThemedText style={styles.errorText}>{generalError}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
            <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
              <IconSymbol size={20} name="envelope.fill" color="#8E54E9" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  setEmailError("")
                  setGeneralError("")
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailError ? <ThemedText style={styles.fieldErrorText}>{emailError}</ThemedText> : null}
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.inputLabel}>Password</ThemedText>
            <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
              <IconSymbol size={20} name="lock.fill" color="#8E54E9" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  setPasswordError("")
                  setGeneralError("")
                }}
                secureTextEntry
              />
            </View>
            {passwordError ? <ThemedText style={styles.fieldErrorText}>{passwordError}</ThemedText> : null}
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
                <IconSymbol size={20} name="arrow.right" color="#ffffff" style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>

          {/* Demo login button for testing */}
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin} activeOpacity={0.8}>
            <ThemedText style={styles.demoButtonText}>Demo Login (Skip Authentication)</ThemedText>
          </TouchableOpacity>

          {!isKeyboardVisible && (
            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Don't have an account?</ThemedText>
              <TouchableOpacity>
                <ThemedText style={styles.signupText}>Contact Admin</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },
  backgroundCircle1: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -width * 0.2,
    left: -width * 0.2,
  },
  backgroundCircle2: {
    position: "absolute",
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    bottom: -width * 0.1,
    right: -width * 0.1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
  },
  logoSubText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    height: 55,
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    color: "#333",
    fontSize: 16,
  },
  fieldErrorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: "#8E54E9",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#8E54E9",
    borderRadius: 12,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#8E54E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  demoButton: {
    marginTop: 15,
    backgroundColor: "rgba(142, 84, 233, 0.2)",
    borderRadius: 12,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  demoButtonText: {
    color: "#8E54E9",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
  },
  signupText: {
    color: "#8E54E9",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
})
