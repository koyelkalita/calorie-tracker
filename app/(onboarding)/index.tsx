import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/Colors';
import { HugeiconsIcon } from '@hugeicons/react-native'
import { ManIcon, WomanIcon, HelpCircleIcon, Target01Icon, Dumbbell01Icon, RulerIcon, WeightScaleIcon, Calendar01Icon } from '@hugeicons/core-free-icons';

const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [gender, setGender] = useState('');
  const [goal, setGoal] = useState('');
  const [workoutDays, setWorkoutDays] = useState('');

  // Date State
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Height & Weight State
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Handle Step Navigation
  const nextStep = () => {
    if (step === 1 && !gender) return Alert.alert('Error', 'Please select a gender.');
    if (step === 2 && !goal) return Alert.alert('Error', 'Please select a goal.');
    if (step === 3 && !workoutDays) return Alert.alert('Error', 'Please select your workout frequency.');

    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Final Submit
  const handleComplete = async () => {
    if (!heightFeet || !heightInches || !weightKg) {
      return Alert.alert('Error', 'Please enter valid height and weight.');
    }

    const onboardingData = {
      gender,
      goal,
      workoutDays,
      birthDate: birthDate.toISOString(),
      height: {
        feet: parseInt(heightFeet, 10),
        inches: parseInt(heightInches, 10),
      },
      weightKg: parseFloat(weightKg),
    };

    router.replace({ 
      pathname: '/(onboarding)/generating', 
      params: { data: JSON.stringify(onboardingData) }
    });
  };

  const renderProgressBar = () => {
    const progressPercentage = (step / TOTAL_STEPS) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>
    );
  };

  const getGenderIcon = (option: string) => {
    if (option === 'Male') return <HugeiconsIcon icon={ManIcon} size={32} color={gender === option ? Colors.primary : Colors.icon} />;
    if (option === 'Female') return <HugeiconsIcon icon={WomanIcon} size={32} color={gender === option ? Colors.primary : Colors.icon} />;
    return <HugeiconsIcon icon={HelpCircleIcon} size={32} color={gender === option ? Colors.primary : Colors.icon} />;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <Text style={styles.stepText}>Step {step} of {TOTAL_STEPS}</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {renderProgressBar()}

      <View style={styles.content}>
        {/* Step 1: Gender */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your gender?</Text>
            <Text style={styles.subtitle}>This helps us calculate your calorie needs accurately.</Text>

            <View style={styles.optionsContainer}>
              {['Male', 'Female', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionCard, gender === option && styles.optionCardSelected]}
                  onPress={() => setGender(option)}
                >
                  {getGenderIcon(option)}
                  <Text style={[styles.optionText, gender === option && styles.optionTextSelected]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <HugeiconsIcon icon={Target01Icon} size={48} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>What is your primary goal?</Text>
            <View style={styles.optionsContainer}>
              {[
                { id: 'gain', label: 'Gain Weight' },
                { id: 'lose', label: 'Lose Weight' },
                { id: 'maintain', label: 'Maintain Weight' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionCardRow, goal === item.id && styles.optionCardSelected]}
                  onPress={() => setGoal(item.id)}
                >
                  <Text style={[styles.optionText, goal === item.id && styles.optionTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Workout Info */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <HugeiconsIcon icon={Dumbbell01Icon} size={48} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>How often do you work out?</Text>
            <View style={styles.optionsContainer}>
              {[
                { id: 'light', label: '1-2 days / week' },
                { id: 'moderate', label: '3-4 days / week' },
                { id: 'active', label: '5-7 days / week' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.optionCardRow, workoutDays === item.id && styles.optionCardSelected]}
                  onPress={() => setWorkoutDays(item.id)}
                >
                  <Text style={[styles.optionText, workoutDays === item.id && styles.optionTextSelected]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Birthdate */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <HugeiconsIcon icon={Calendar01Icon} size={48} color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>When were you born?</Text>
            <Text style={styles.subtitle}>Age is used to determine your metabolic rate.</Text>

            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateSelectorText}>
                {birthDate.toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') setShowDatePicker(false);
                  if (selectedDate) setBirthDate(selectedDate);
                }}
              />
            )}

            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity style={styles.doneBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 5: Height & Weight */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What are your current stats?</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 16 }}>
              <HugeiconsIcon icon={RulerIcon} size={24} color={Colors.icon} style={{ marginRight: 8 }} />
              <Text style={styles.inputLabel}>Height</Text>
            </View>
            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="ft"
                  placeholderTextColor={Colors.icon}
                  value={heightFeet}
                  onChangeText={setHeightFeet}
                  maxLength={1}
                />
              </View>
              <Text style={styles.unitText}>ft</Text>

              <View style={[styles.inputWrapper, { marginLeft: 16 }]}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="in"
                  placeholderTextColor={Colors.icon}
                  value={heightInches}
                  onChangeText={setHeightInches}
                  maxLength={2}
                />
              </View>
              <Text style={styles.unitText}>in</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 32 }}>
              <HugeiconsIcon icon={WeightScaleIcon} size={24} color={Colors.icon} style={{ marginRight: 8 }} />
              <Text style={styles.inputLabel}>Weight</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={Colors.icon}
                value={weightKg}
                onChangeText={setWeightKg}
                maxLength={5}
              />
            </View>
            <Text style={[styles.unitText, { marginTop: 8, alignSelf: 'center' }]}>kg</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={step === TOTAL_STEPS ? handleComplete : nextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step === TOTAL_STEPS ? 'Complete' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16 },
  backButton: { padding: 8, marginLeft: -8 },
  backButtonText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '500' },
  backButtonPlaceholder: { width: 50 },
  stepText: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  progressBarContainer: { height: 6, backgroundColor: Colors.border, marginHorizontal: 24, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  stepContainer: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 32 },
  optionsContainer: { gap: 16, marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  optionCard: { width: '45%', padding: 20, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  optionCardRow: { width: '100%', padding: 20, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  optionCardSelected: { borderColor: Colors.primary, backgroundColor: '#E6F9F6' },
  optionText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 12 },
  optionTextSelected: { color: Colors.primary },
  dateSelector: { padding: 16, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, marginTop: 24 },
  dateSelectorText: { fontSize: 18, color: Colors.text, textAlign: 'center', fontWeight: '500' },
  doneBtn: { marginTop: 16, alignItems: 'center', padding: 12, backgroundColor: Colors.surface, borderRadius: 8, alignSelf: 'center', width: '50%', borderWidth: 1, borderColor: Colors.border },
  doneBtnText: { color: Colors.primary, fontWeight: 'bold', fontSize: 16 },
  inputLabel: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputWrapper: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, height: 60, justifyContent: 'center' },
  input: { fontSize: 24, color: Colors.text, textAlign: 'center', width: '100%', fontWeight: 'bold' },
  unitText: { fontSize: 18, color: Colors.textSecondary, marginLeft: 8, fontWeight: '500' },
  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, backgroundColor: Colors.background },
  primaryButton: { backgroundColor: Colors.primary, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' }
});
