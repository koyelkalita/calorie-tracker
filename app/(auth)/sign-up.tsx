import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { Mail, Lock, User } from "lucide-react-native";

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!firstName || !emailAddress || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailAddress,
        password
      );
      const firebaseUser = userCredential.user;

      // Save display name on the Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: firstName });

      // Save user document to Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        userId: firebaseUser.uid,
        email: emailAddress,
        firstName: firstName,
        createdAt: new Date().toISOString(),
      });

      console.log("User successfully saved to Firestore!");
      // onAuthStateChanged in _layout.tsx will detect the new session
      // and automatically redirect to "/"
    } catch (err: any) {
      console.error("Sign up error:", err);
      const message =
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists."
          : err.code === "auth/weak-password"
            ? "Password should be at least 6 characters."
            : err.code === "auth/invalid-email"
              ? "Please enter a valid email address."
              : err.message;
      Alert.alert("Sign Up Failed", message);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your health journey today</Text>
        </View>

        <View style={styles.formView}>
          <View style={styles.inputContainer}>
            <User color="#9CA3AF" size={20} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="words"
              value={firstName}
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              onChangeText={setFirstName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail color="#9CA3AF" size={20} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailAddress}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              onChangeText={setEmailAddress}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#9CA3AF" size={20} style={styles.inputIcon} />
            <TextInput
              value={password}
              placeholder="Password (min. 6 characters)"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSignUpPress}
            disabled={loading || !emailAddress || !password || !firstName}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign In</Text>
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
    backgroundColor: "#F9FAFB",
  },
  content: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  formView: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    shadowColor: "#000",
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
    color: "#111827",
    height: "100%",
  },
  primaryButton: {
    backgroundColor: "#00BFA6",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#00BFA6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
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
    color: "#6B7280",
    fontSize: 15,
  },
  footerLink: {
    color: "#00BFA6",
    fontSize: 15,
    fontWeight: "bold",
  },
});
