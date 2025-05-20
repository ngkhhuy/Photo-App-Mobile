import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useNavigation } from '@react-navigation/native';

// Type for a single search result
type SearchItem = {
  id: string;
  title: string;
  image: string;
  raw: any;
};

const SearchScreen = () => {

  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/v1/photos/search`, { params: { query } });
      console.log('Search response data:', data);
      // Normalize into UI model: id, title, image
      const items = Array.isArray(data) ? data : data.photos || [];
      const mapped = items.map((photo: any) => ({
        id: photo._id || photo.id,
        title: photo.description || photo.title,
        image: photo.url || photo.image || photo.imageUrl,
        raw: photo,
      }));
      setSearchResults(mapped);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchItem = ({ item }: { item: SearchItem }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => navigation.navigate('PhotoDetail', { photo: item.raw })}
    >
      <View style={styles.photoContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.photoImage}
          resizeMode="cover"
        />
        
        {/* Show private indicator if the photo is the user's private photo */}
        {!item.raw.isPublic && (
          <View style={styles.privateIndicator}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
          </View>
        )}
        
        <Text style={styles.photoDescription} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
     
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

     
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Photos</Text>
        <TouchableOpacity style={styles.searchIconButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by description..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        {loading && <ActivityIndicator style={{ marginLeft: 8 }} size="small" color="#333" />}
      </View>

      
      <FlatList
        data={searchResults}
        renderItem={renderSearchItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.flatListContent}
      />

      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
   
    paddingTop: Platform.OS === 'android' ? ((StatusBar.currentHeight ?? 0) + 10) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchIconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  flatListContent: {
    paddingBottom: 60, 
  },
  searchResultItem: {
    margin: 16,
    marginBottom: 0,
  },
  searchResultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
  },
  searchResultTitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  photoContainer: {
    marginTop: 8,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
  },
  privateIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 4,
  },
  photoDescription: {
    marginTop: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default SearchScreen;