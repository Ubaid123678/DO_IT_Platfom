import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWizard } from '@/src/context/VerificationWizardContext';
import { verificationService } from '@/src/services/verificationService';
import { Colors, type AppColors } from '@/src/theme/colors';

const sampleQuestions = [
  { id: 'q1', text: 'Which data structure uses FIFO order?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correct: 1 },
  { id: 'q2', text: 'What does API stand for?', options: ['Application Program Interface', 'Application Programming Interface', 'Automated Program Integration', 'Application Process Integration'], correct: 1 },
  { id: 'q3', text: 'Which of these is a version control system?', options: ['MySQL', 'Git', 'Docker', 'Node.js'], correct: 1 },
];

export default function SkillTestStep() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const { state, dispatch } = useWizard();

  const currentCat = state.selectedCategories[state.currentCategoryIndex];
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers, String(idx)];
    setAnswers(newAnswers);

    if (currentQ + 1 < sampleQuestions.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      const correct = newAnswers.filter((a, i) => Number(a) === sampleQuestions[i].correct).length;
      setScore(correct);
      setFinished(true);
    }
  };

  const handleFinish = () => {
    const passed = score >= 2;
    try {
      Alert.alert(
        passed ? 'Test Passed!' : 'Test Failed',
        `You scored ${score}/${sampleQuestions.length}. ${passed ? 'Your skill has been auto-approved!' : 'A reviewer will evaluate your submission.'}`,
        [{ text: 'OK', onPress: () => dispatch({ type: 'COMPLETE_CATEGORY_EVIDENCE' }) }],
      );
    } catch {
      Alert.alert('Error', 'Failed to submit test results.');
    }
  };

  const styles = makeStyles(C);

  if (finished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: score >= 2 ? '#E8F8F2' : '#FDECEA', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name={score >= 2 ? 'checkmark-circle' : 'close-circle'} size={48} color={score >= 2 ? C.success : C.error} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 }}>
            {score >= 2 ? 'Passed!' : 'Needs Review'}
          </Text>
          <Text style={{ fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 24 }}>
            You scored {score}/{sampleQuestions.length}
          </Text>
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!started) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skill Test</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ paddingHorizontal: 20, flex: 1, justifyContent: 'center' }}>
          <View style={styles.illustration}>
            <Ionicons name="pencil-outline" size={64} color={C.primary} />
          </View>
          <Text style={styles.title}>Ready to test your skills?</Text>
          <Text style={styles.subtitle}>
            Answer {sampleQuestions.length} multiple-choice questions to demonstrate your knowledge. You need {Math.ceil(sampleQuestions.length * 0.6)}/3 correct to auto-pass.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => setStarted(true)}>
            <Text style={styles.startBtnText}>Start Test</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const question = sampleQuestions[currentQ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => dispatch({ type: 'SET_STEP', step: 'evidence-type-choice' })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question {currentQ + 1}/{sampleQuestions.length}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 20, flex: 1, justifyContent: 'center' }}>
        <View style={styles.progressDots}>
          {sampleQuestions.map((_, i) => (
            <View key={i} style={[styles.dot, i <= currentQ && { backgroundColor: C.primary }]} />
          ))}
        </View>
        <Text style={styles.questionText}>{question.text}</Text>
        {question.options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.optionCard}
            onPress={() => handleAnswer(idx)}
            activeOpacity={0.7}
          >
            <View style={styles.optionCircle}>
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
            </View>
            <Text style={styles.optionText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: C.textPrimary },
  illustration: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  startBtn: { backgroundColor: C.primary, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  startBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.divider },
  questionText: { fontSize: 18, fontWeight: '600', color: C.textPrimary, marginBottom: 24, lineHeight: 26 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: C.cardBorder },
  optionCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionLetter: { fontSize: 14, fontWeight: '700', color: C.primary },
  optionText: { fontSize: 14, color: C.textPrimary, flex: 1 },
  finishBtn: { backgroundColor: C.primary, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  finishBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

