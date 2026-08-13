import { useEffect, useState } from "react";
import {
  Image,
  Text,
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Link } from "expo-router";

interface Pokemon {
  name: string;
  // url: string;
  imageUrl: string;
  imageBack: string;
  types: DetailedType[];
}

interface TypeRef {
  name: string;
  url: string;
}

interface DetailedType {
  slot: number;
  type: TypeRef;
}

const colorsByType = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

export default function Index() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);

  useEffect(() => {
    fetchPokemons();
  }, []);

  async function fetchPokemons() {
    try {
      const response = await fetch(
        "https://pokeapi.co/api/v2/pokemon?limit=10",
      );
      const data = await response.json();

      const detailedPokemons = await Promise.all(
        data.results.map(async (pokemon: any) => {
          const response = await fetch(pokemon.url);
          const detailedData = await response.json();
          return {
            name: detailedData.name,
            imageUrl: detailedData.sprites.front_default, // You can change this to any other property you want to display
            imageBack: detailedData.sprites.back_default, // You can change this to any other property you want to display
            types: detailedData.types, // Extracting types
          };
        }),
      );

      setPokemons(detailedPokemons);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        padding: 16,
      }}
    >
      {pokemons.map((pokemon) => (
        <Link key={pokemon.name} href={{ pathname: "/pokemonDetails", params: { name: pokemon.name } }}>
          <View
            style={[
              styles.container,
              {
                backgroundColor:
                  colorsByType[
                    (pokemon.types[0].type.name as keyof typeof colorsByType) ||
                      "normal"
                  ] + 50,
              },
            ]}
          >
            <Text style={styles.name}>{pokemon.name}</Text>
            <Text style={styles.type}>{pokemon.types[0].type.name}</Text>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Image
                source={{ uri: pokemon.imageUrl }}
                style={{ width: 150, height: 150 }}
              />
              <Image
                source={{ uri: pokemon.imageBack }}
                style={{ width: 150, height: 150 }}
              />
            </View>
          </View>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
    borderRadius: 20,
    // cursor: "pointer",
    // backgroundColor is set dynamically per-item inline where the component is rendered
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  type: {
    fontSize: 16,
    fontWeight: "bold",
    color: "grey",
  },
});
