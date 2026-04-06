import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

async function ensureUserDocument(firebaseUser: User) {
  const creationTime = firebaseUser.metadata.creationTime;
  if (creationTime) {
    const createdAt = new Date(creationTime).getTime();
    const now = Date.now();
    // If account was created within last 10 seconds, let sign-up.tsx handle it
    if (now - createdAt < 10000) {
      return;
    }
  }
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      userId: firebaseUser.uid,
      email: firebaseUser.email ?? "",
      firstName: firebaseUser.displayName ?? "",
      createdAt: new Date().toISOString(),
      isOnboarded: false,
    });
    console.log("User document created in Firestore.");
    return { isOnboarded: false };
  }
  return snapshot.data();
}

function useProtectedRoute(user: User | null, isOnboarded: boolean | null, initializing: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing || (user && isOnboarded === null)) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/sign-in");
      }
    } else {
      if (!isOnboarded) {
        if (!inOnboardingGroup) {
          router.replace("/(onboarding)");
        }
      } else {
        if (inAuthGroup || inOnboardingGroup) {
          router.replace("/");
        }
      }
    }
  }, [user, isOnboarded, segments, initializing]);
}

const InitialLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await ensureUserDocument(firebaseUser);
          setIsOnboarded(userData?.isOnboarded || false);
        } catch (err) {
          console.warn("Failed to ensure user document:", err);
          setIsOnboarded(false);
        }
      } else {
        setIsOnboarded(null);
      }
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useProtectedRoute(user, isOnboarded, initializing);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  return <InitialLayout />;
}
