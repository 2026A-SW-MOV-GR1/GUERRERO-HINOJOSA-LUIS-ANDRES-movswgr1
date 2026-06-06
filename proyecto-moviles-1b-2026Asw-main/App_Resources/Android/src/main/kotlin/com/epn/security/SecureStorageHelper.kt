package com.epn.security

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

// Delegate to instantiate DataStore on Context
val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "epn_secure_datastore")

object SecureStorageHelper {

    // --- 1. SharedPreferences (Texto Plano / Síncrono) ---
    @JvmStatic
    fun saveSharedPreferences(context: Context, key: String, value: String) {
        val sharedPref = context.getSharedPreferences("epn_plain_preferences", Context.MODE_PRIVATE)
        sharedPref.edit().putString(key, value).apply()
    }

    @JvmStatic
    fun getSharedPreferences(context: Context, key: String): String? {
        val sharedPref = context.getSharedPreferences("epn_plain_preferences", Context.MODE_PRIVATE)
        return sharedPref.getString(key, null)
    }

    // --- 2. EncryptedSharedPreferences (Cifrado AES-256 SIV & AES-256 GCM) ---
    @JvmStatic
    fun saveEncryptedPreferences(context: Context, key: String, value: String) {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        val encryptedSharedPrefs = EncryptedSharedPreferences.create(
            "epn_encrypted_preferences",
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        encryptedSharedPrefs.edit().putString(key, value).apply()
    }

    @JvmStatic
    fun getEncryptedPreferences(context: Context, key: String): String? {
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        val encryptedSharedPrefs = EncryptedSharedPreferences.create(
            "epn_encrypted_preferences",
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        return encryptedSharedPrefs.getString(key, null)
    }

    // --- 3. Jetpack Preferences DataStore (Asíncrono Reactivo encapsulado) ---
    @JvmStatic
    fun saveDataStore(context: Context, key: String, value: String) {
        val dataStoreKey = stringPreferencesKey(key)
        runBlocking {
            context.dataStore.edit { settings ->
                settings[dataStoreKey] = value
            }
        }
    }

    @JvmStatic
    fun getDataStore(context: Context, key: String): String? {
        val dataStoreKey = stringPreferencesKey(key)
        return runBlocking {
            val preferences = context.dataStore.data.first()
            preferences[dataStoreKey]
        }
    }
}
