import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon, ZapIcon } from '@hugeicons/core-free-icons';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export default function GeneratingScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  // Rotating status message
  const [statusText, setStatusText] = useState('Analyzing your profile...');

  useEffect(() => {
    let statusInterval: ReturnType<typeof setInterval>;

    if (loading) {
      const messages = [
        'Analyzing your profile...',
        'Calculating optimal macros...',
        'Optimizing for your goals...',
        'Generating your personalized fitness plan...',
        'Generating your personalized workout plan...',
        'Generating your personalized diet plan...',
        'Generating your personalized meal plan...',
        'Finalizing fitness plan...',
        'Almost there...'
      ];
      let msgIndex = 0;
      statusInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        setStatusText(messages[msgIndex]);
      }, 2000);
    }

    return () => clearInterval(statusInterval);
  }, [loading]);

  useEffect(() => {
    const generatePlan = async () => {
      try {
        if (!data || typeof data !== 'string') {
          throw new Error('No user data found.');
        }
        const onboardingData = JSON.parse(data);
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated.');

        if (!GEMINI_API_KEY) {
          throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not configured in .env file.');
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are a professional fitness and nutrition coach.
Based on the following user profile, generate a balanced standard diet macro profile and fitness advice.
Output must be pure JSON with no markdown formatting.

User Profile:
- Gender: ${onboardingData.gender}
- Goal: ${onboardingData.goal}
- Workout Frequency: ${onboardingData.workoutDays}
- Birthdate: ${onboardingData.birthDate}
- Height: ${onboardingData.height?.feet} feet ${onboardingData.height?.inches} inches
- Weight: ${onboardingData.weightKg} kg

Return ONLY a JSON object exactly matching this structure:
{
  "dailyCalories": 2500,
  "proteinGrams": 150,
  "carbsGrams": 250,
  "fatGrams": 70,
  "waterLiters": 3.0,
  "customAdvice": "A short, 2-sentence encouraging advice tailored to their goal."
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const aiData = JSON.parse(responseText);

        const completeData = {
          ...onboardingData,
          nutritionPlan: aiData,
          isOnboarded: true,
        };

        // Save to Firestore and AsyncStorage
        await AsyncStorage.setItem(`@user_data_${user.uid}`, JSON.stringify(completeData));
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, completeData);

        setGeneratedPlan(aiData);
        setLoading(false);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to generate plan.');
        setLoading(false);
      }
    };

    generatePlan();
  }, [data]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Something went wrong!</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={async () => {
          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { isOnboarded: true });
          }
          router.replace('/');
        }}>
          <Text style={styles.buttonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 32 }} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={80} color={Colors.primary} style={{ marginBottom: 24 }} />
      <Text style={styles.title}>Your Plan is Ready!</Text>
      <Text style={styles.subtitle}>We've calculated your optimal daily targets.</Text>

      <View style={styles.card}>
        <View style={styles.macroRow}>
          <View style={styles.macroBox}>
            <Text style={styles.macroValue}>{generatedPlan?.dailyCalories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroValue}>{generatedPlan?.waterLiters}L</Text>
            <Text style={styles.macroLabel}>Water</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.macroRow}>
          <View style={styles.macroBoxSmall}>
            <Text style={styles.macroValueSmall}>{generatedPlan?.proteinGrams}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroBoxSmall}>
            <Text style={styles.macroValueSmall}>{generatedPlan?.carbsGrams}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroBoxSmall}>
            <Text style={styles.macroValueSmall}>{generatedPlan?.fatGrams}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      <View style={styles.adviceCard}>
        <Text style={styles.adviceText}>{generatedPlan?.customAdvice}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/')}>
        <Text style={styles.primaryButtonText}>Let's Go!</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.error,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroBox: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
  },
  macroLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  macroBoxSmall: {
    alignItems: 'center',
    flex: 1,
  },
  macroValueSmall: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  adviceCard: {
    backgroundColor: '#E6F9F6',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 'auto',
  },
  adviceText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
