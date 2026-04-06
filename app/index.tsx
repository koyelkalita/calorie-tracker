import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { Colors } from "../constants/Colors";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged in _layout.tsx will handle redirect
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calorie Tracker</Text>
      <Text style={styles.subtitle}>
        Welcome back,{" "}
        {user?.displayName || user?.email?.split("@")[0] || "User"}!
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: "center",
  },
  button: {
    backgroundColor: Colors.error,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
