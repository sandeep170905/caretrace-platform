import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar
} from 'react-native';
import { DonorHomeScreen } from './src/screens/DonorHomeScreen';
import { PickupAgentScreen } from './src/screens/PickupAgentScreen';
import { getApiBase, setApiBase } from './src/api/mobileClient';

type Persona = 'DONOR' | 'AGENT';

export default function App() {
  const [activePersona, setActivePersona] = useState<Persona>('DONOR');
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiBase());

  // Personas matching seeded Indian/Chennai data
  const donorUser = {
    id: 'user-donor-ajith',
    name: 'Ajith R'
  };

  const agentUser = {
    id: 'user-agent-sakthivel',
    name: 'Sakthivel S'
  };

  const handleSaveServerUrl = () => {
    setApiBase(serverUrlInput);
    setConfigModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Application Header */}
      <View style={styles.appHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>CT</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>CareTrace Mobile</Text>
            <Text style={styles.brandSub}>Zero-Trust Physical Custody Platform</Text>
          </View>
        </View>

        {/* Server IP Config Cog */}
        <TouchableOpacity
          style={styles.configBtn}
          onPress={() => {
            setServerUrlInput(getApiBase());
            setConfigModalVisible(true);
          }}
        >
          <Text style={styles.configBtnText}>⚙ API</Text>
        </TouchableOpacity>
      </View>

      {/* Persona Role Switcher Segmented Control */}
      <View style={styles.roleSwitcherContainer}>
        <TouchableOpacity
          style={[styles.roleTab, activePersona === 'DONOR' && styles.roleTabActive]}
          onPress={() => setActivePersona('DONOR')}
        >
          <Text style={[styles.roleTabText, activePersona === 'DONOR' && styles.roleTabTextActive]}>
            👤 Donor: Ajith R
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleTab, activePersona === 'AGENT' && styles.roleTabActive]}
          onPress={() => setActivePersona('AGENT')}
        >
          <Text style={[styles.roleTabText, activePersona === 'AGENT' && styles.roleTabTextActive]}>
            🚚 Agent: Sakthivel S
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Persona Screen */}
      <View style={styles.screenContainer}>
        {activePersona === 'DONOR' ? (
          <DonorHomeScreen donorId={donorUser.id} donorName={donorUser.name} />
        ) : (
          <PickupAgentScreen agentId={agentUser.id} agentName={agentUser.name} />
        )}
      </View>

      {/* Server Base URL Configuration Modal (crucial for physical device Expo Go testing) */}
      <Modal
        visible={configModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.configModal}>
            <Text style={styles.configTitle}>Backend Server Configuration</Text>
            <Text style={styles.configDesc}>
              For testing on a physical phone via Expo Go, point to your computer's local Wi-Fi IP address (e.g. http://192.168.1.50:5000/api):
            </Text>

            <TextInput
              style={styles.urlInput}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="http://localhost:5000/api"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setServerUrlInput('http://localhost:5000/api')}
              >
                <Text style={styles.presetBtnText}>Localhost</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setServerUrlInput('http://10.0.2.2:5000/api')}
              >
                <Text style={styles.presetBtnText}>Android</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetBtn, { backgroundColor: '#0d9488' }]}
                onPress={() => setServerUrlInput('https://caretrace-backend-fluw.onrender.com/api')}
              >
                <Text style={[styles.presetBtnText, { color: '#ffffff', fontWeight: '700' }]}>Render Cloud</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.configActionRow}>
              <TouchableOpacity
                style={styles.configCancelBtn}
                onPress={() => setConfigModalVisible(false)}
              >
                <Text style={styles.configCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.configSaveBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.configSaveText}>Apply Endpoint</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#0f172a'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  logoBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900'
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  brandSub: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500'
  },
  configBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  configBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700'
  },
  roleSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8
  },
  roleTabActive: {
    backgroundColor: '#0d9488'
  },
  roleTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700'
  },
  roleTabTextActive: {
    color: '#ffffff'
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  configModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  configTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6
  },
  configDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 18
  },
  urlInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    fontFamily: 'monospace',
    marginBottom: 10
  },
  presetRow: {
    flexDirection: 'row',
    marginBottom: 16
  },
  presetBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8
  },
  presetBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  configActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12
  },
  configCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8
  },
  configCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13
  },
  configSaveBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  configSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});

