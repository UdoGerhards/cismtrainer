import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomDrawer({ navigation, links }) {
  return (
    <View style={styles.container}>
      {links.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.link}
          onPress={() => navigation.navigate(item.route)}
        >
          <Text style={styles.linkText}>{item.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff"
  },
  link: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  linkText: {
    fontSize: 18
  }
});
