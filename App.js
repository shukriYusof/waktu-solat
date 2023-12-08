import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { Dimensions, StatusBar, Text, View, Switch, Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import moment from 'moment-timezone';
import { scheduleNotificationAsync, getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [city, setCity] = useState(null);
  const [timezone, setTimezone] = useState(null);
  const [prayers, setPrayers] = useState([]);
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  const handleLocationPermission = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Allow Passive Pahala to access your location',
        'This lets Passive Pahala use your location to fetch the current prayers time based on your location',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          { text: 'OK', onPress: () => Linking.openSettings() },
        ],
        { cancelable: false }
      );
    }
  }, []);

  const handleNotificationPermission = useCallback(async () => {
    const { status } = await getPermissionsAsync();

    if (status !== 'granted') {
      const { status: newStatus } = await requestPermissionsAsync();
      if (newStatus !== 'granted') {
        // Handle the case where the user denies notification permissions
        Alert.alert('Notification Permission Denied', 'Please enable notifications in your device settings.',[
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          { text: 'OK', onPress: () => Linking.openSettings() },
        ],
        { cancelable: false });
        return;
      }
    }
  })
  const handleNotification = useCallback(async () => {
    console.log('notify')
    await scheduleNotificationAsync({
      content: {
        title: 'Prayer Time',
        body: 'It is time for prayer!',
      },
      trigger: { seconds: 30 }, // Trigger the notification after 1 second (for testing)
    });
  }, []);

  const getPrayersTime = useCallback(async () => {
    try {
      let { coords } = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(coords);
  
      const storedPrayers = await AsyncStorage.getItem('prayers');
      const storedDate = await AsyncStorage.getItem('prayersDate');
      const currentDate = new Date().toLocaleDateString();
  
      if (storedPrayers !== null && storedDate === currentDate) {
        console.log('cache');
        let prayers = JSON.parse(storedPrayers);
        setPrayers(prayers);
      } else {
        console.log('api');
  
        let coordinates = new Coordinates(coords.latitude, coords.longitude);
        let { fajr, dhuhr, asr, maghrib, isha } = new PrayerTimes(
          coordinates,
          new Date(),
          CalculationMethod.MoonsightingCommittee()
        );
  
        let prayersTime = {
          fajr,
          dhuhr,
          asr,
          maghrib,
          isha,
        };
  
        AsyncStorage.setItem('prayers', JSON.stringify(prayersTime));
        AsyncStorage.setItem('prayersDate', currentDate);
        setPrayers(prayersTime);
      }
  
      setTimezone(address[0].timezone != null ? address[0].timezone : Localization.timezone);
      setCity(address[0].city);
    } catch (error) {
      // Handle errors here
      console.error(error);
    }
  }, []);  

  useEffect(() => {
    handleLocationPermission();
    handleNotificationPermission();
  }, [handleLocationPermission]);

  useEffect(() => {
    if (prayers.length < 1 ) {
      getPrayersTime();
    }
  }, [prayers]);

  useEffect(() => {
    handleNotification();
  },[handleNotification])
  const prayerElement = () => {
    return (
      <View style={styles.parentPrayerContainer}>
        {Object.entries(prayers).map(([prayerKey, prayerValue], index) => (
          <View key={index} style={styles.prayerContainer}>
            <View>
              <Text style={styles.prayName}>{prayerKey}</Text>
              {timezone ? (
              <Text style={styles.prayTime}>
                {moment(prayerValue).tz(timezone).format('h:mm A')}
              </Text>
            ) : (
              <Text style={styles.prayTime}>Loading...</Text>
            )}
            </View>
            <View>
            <Switch
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isEnabled}
                style={{ transform: [{ scale: 0.8 }] }} // Adjust the scale to make the switch smaller
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <View style={styles.icon}></View>
      <View style={styles.list}>
        <Text style={styles.title}>Prayers Time</Text>
        <Text style={styles.city}>{city}</Text>
        {prayerElement()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
  },

  prayerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#d4d4d4',
    marginBottom: 6,
  },

  prayName: {},

  prayTime: {
    fontSize: 16,
    color: '#6b6b6b',
  },

  parentPrayerContainer: {
    marginTop: 6,
  },

  list: {
    width: '100%',
    height: Dimensions.get('window').height * 0.67,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  icon: {
    width: '100%',
    height: Dimensions.get('window').height * 0.33,
    backgroundColor: 'blue',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  city: {
    fontSize: 16,
    marginBottom: 16,
    color: '#ababab',
  },
});

export default App;
