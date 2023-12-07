import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  SunnahTimes,
  Prayer,
  Qibla,
} from 'adhan';
import { Dimensions, StatusBar, Text, View, Switch } from 'react-native';
import { StyleSheet } from 'react-native';
import moment from 'moment-timezone';

const App = () => {
    const [city, setCity] = useState(null)
    const [prayers, setPrayers] = useState([])
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);
    
    const handleLocationPermission = useCallback(async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
              Alert.alert(
                'Allow Passive Pahala to access your location',
                'This lets Passive Pahala to use your location to fetch the current prayers time based on your location',
                [
                    {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel'
                    },
                    { text: 'OK', onPress: () => Linking.openSettings() }
                ],
                { cancelable: false }
            );
        }
    }, []);

    const getPrayersTime = useCallback(async () => {

        let { coords } = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync(coords);
        let coordinates = new Coordinates(coords.latitude, coords.longitude)
        let { fajr, dhuhr, asr, maghrib, isha } = new PrayerTimes(coordinates, new Date(), CalculationMethod.MoonsightingCommittee())

        let prayersTime = {
            fajr,
            dhuhr,
            asr,
            maghrib,
            isha
        }

        setPrayers(prayersTime)
        setCity(address[0].city)
    }, []);

    useEffect(() => {
        handleLocationPermission()
    }, [handleLocationPermission])

    useEffect(() => {
        if (prayers.length < 1) {
            getPrayersTime()
        }
    }, [prayers])

    return (
        <View style={styles.container}>
            <StatusBar hidden={true} />
            <View style={styles.icon}>
            </View>
            <View style={styles.list}>
                <Text style={styles.title}>Prayers Time</Text>
                <Text style={styles.city}>
                   {city}
                </Text>
                  <View style={styles.prayerContainer}>
                        <View>
                            <Text style={styles.prayName}>Fajr</Text>
                            <Text style={styles.prayTime}>{ moment(prayers.fajr).tz('America/New_York').format('h:mm A') }</Text>
                        </View>
                        <View>
                          <Switch
                            trackColor={{false: '#767577', true: '#81b0ff'}}
                            thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
                            ios_backgroundColor="#3e3e3e"
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                          />
                        </View>
                  </View>

                
            </View>
            
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
  },

  prayerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 8,
    borderWidth: .5,
    borderColor: '#d4d4d4',
  },

  prayName: {

  },

  prayTime: {
    fontSize: 16,
    color: '#6b6b6b'
  },

  list: {
    flex: 4,
    width: '100%',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  icon: {
    flex: 2,
    width: '100%',
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