import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Mail, Lock } from "lucide-react-native";
import { Colors } from "../../constants/Colors";

export default function SignInScreen() {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!emailAddress || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailAddress, password);
      // onAuthStateChanged in _layout.tsx will detect the sign-in
      // and automatically redirect to "/"
    } catch (err: any) {
      console.error("Sign in error:", err);
      const message =
        err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
          ? "Invalid email or password."
          : err.message;
      Alert.alert("Sign In Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Track your calories and stay healthy</Text>
        </View>

        <View style={styles.formView}>
          <View style={styles.inputContainer}>
            <Mail color={Colors.icon} size={20} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailAddress}
              placeholder="Email"
              placeholderTextColor={Colors.icon}
              onChangeText={setEmailAddress}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color={Colors.icon} size={20} style={styles.inputIcon} />
            <TextInput
              value={password}
              placeholder="Password"
              placeholderTextColor={Colors.icon}
              secureTextEntry
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSignInPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 600,
    marginTop: 50,
    height: 200,
    marginBottom: -10,
    borderRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  formView: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: "100%",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 32,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "bold",
  },
});
