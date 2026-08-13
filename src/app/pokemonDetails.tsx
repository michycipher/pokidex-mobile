import { useEffect, useState } from "react";
import { Image, Text, View, StyleSheet, ScrollView } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function pokemonDetails() {
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log("Params:", params);
  }, [params]);
  async function fetchPokemonDetails() {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${params.name}`,
      );
      const data = await response.json();
      console.log("Pokemon Details:", data);
    } catch (error) {
      console.error("Error fetching Pokemon details:", error);
    }
  }

  useEffect(() => {
    fetchPokemonDetails();
  }, [params.name]);

  return (
    <>
    <Stack.Screen options={{ title: params.name as string}} />
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        padding: 16,
      }}
    >
      <View>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{params.name}</Text>
        {/* You can add more details about the Pokemon here */}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({});
