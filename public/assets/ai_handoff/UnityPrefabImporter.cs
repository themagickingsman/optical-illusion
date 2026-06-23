using UnityEngine;
using UnityEditor;
using System.IO;

[System.Serializable]
public class FlameEffectData
{
    public string asset_name;
    public ColorsData colors;
    public PhysicsData physics_curves;
}

[System.Serializable]
public class ColorsData
{
    public string idle;
    public string active;
}

[System.Serializable]
public class PhysicsData
{
    public float throttle_scale;
    public float noise_frequency;
}

public class UnityPrefabImporter
{
    /// <summary>
    /// Cosmic Racers - AI Asset Handoff Pipeline
    /// Reads flame_effect.json and configures a Unity VFX Graph / Particle System Prefab.
    /// Proves our pipeline translates WebGL math seamlessly into Unity Editor commands.
    /// </summary>
    [MenuItem("Cosmic Racers/Import AI Asset (JSON)")]
    public static void ImportFlameEffect()
    {
        string jsonPath = EditorUtility.OpenFilePanel("Select AI Asset JSON", "", "json");
        if (string.IsNullOrEmpty(jsonPath)) return;

        string jsonContent = File.ReadAllText(jsonPath);
        FlameEffectData data = JsonUtility.FromJson<FlameEffectData>(jsonContent);

        Debug.Log($"[Cosmic Handoff] Processing AI Asset Key for: {data.asset_name}");

        // 1. Locate the base template prefab in the project
        string templatePath = "Assets/CosmicRacers/Templates/BaseFlameFX.prefab";
        GameObject templatePrefab = AssetDatabase.LoadAssetAtPath<GameObject>(templatePath);

        if (templatePrefab == null)
        {
            Debug.LogError($"[Cosmic Handoff] Base template not found at {templatePath}");
            return;
        }

        // 2. Instantiate and configure
        GameObject fxInstance = (GameObject)PrefabUtility.InstantiatePrefab(templatePrefab);
        fxInstance.name = data.asset_name;

        // Convert Hex Colors from WebGL format
        Color idleColor;
        ColorUtility.TryParseHtmlString(data.colors.idle, out idleColor);
        
        Color activeColor;
        ColorUtility.TryParseHtmlString(data.colors.active, out activeColor);

        // 3. Inject parameters into the Particle System / VFX Graph
        var mainModule = fxInstance.GetComponent<ParticleSystem>().main;
        
        // Setup MinMaxGradient to simulate the throttle mix from the WebGL shader
        ParticleSystem.MinMaxGradient colorGradient = new ParticleSystem.MinMaxGradient(idleColor, activeColor);
        mainModule.startColor = colorGradient;
        
        // Map the Shader noise frequency to Unity Particle noise
        var noiseModule = fxInstance.GetComponent<ParticleSystem>().noise;
        noiseModule.enabled = true;
        noiseModule.frequency = data.physics_curves.noise_frequency;
        noiseModule.strength = data.physics_curves.throttle_scale;

        // 4. Save as a new concrete Prefab for the engineers to use
        string newPrefabPath = $"Assets/CosmicRacers/FX/{data.asset_name}.prefab";
        
        // Ensure directory exists
        Directory.CreateDirectory("Assets/CosmicRacers/FX");
        
        PrefabUtility.SaveAsPrefabAsset(fxInstance, newPrefabPath);
        Object.DestroyImmediate(fxInstance);

        Debug.Log($"[Cosmic Handoff] Pipeline Complete! New Prefab generated at {newPrefabPath}");
    }
}
