using System.Text.Json;
using System.Text.Json.Serialization;

namespace WorkRoll.Core;

public sealed class JsonFileStorage : IPluginStorage
{
    private readonly string directory;
    private readonly object gate = new();
    private readonly JsonSerializerOptions options = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public JsonFileStorage(string rootDirectory, string storageNamespace)
    {
        directory = Path.Combine(rootDirectory, "plugins", Sanitize(storageNamespace));
        Directory.CreateDirectory(directory);
    }

    public T Load<T>(string key, T fallback)
    {
        lock (gate)
        {
            try
            {
                var path = GetPath(key);
                if (!File.Exists(path)) return fallback;
                var json = File.ReadAllText(path);
                return JsonSerializer.Deserialize<T>(json, options) ?? fallback;
            }
            catch
            {
                // 损坏的单个命名空间只回退到默认值，不影响宿主和其它插件。
                return fallback;
            }
        }
    }

    public void Save<T>(string key, T value)
    {
        lock (gate)
        {
            try
            {
                var path = GetPath(key);
                var temp = path + ".tmp";
                File.WriteAllText(temp, JsonSerializer.Serialize(value, options));
                File.Move(temp, path, true);
            }
            catch
            {
                // 本地存储不可用时，应用仍保持可操作；下次启动会使用默认值。
            }
        }
    }

    public void Delete(string key)
    {
        lock (gate)
        {
            try
            {
                var path = GetPath(key);
                if (File.Exists(path)) File.Delete(path);
            }
            catch { }
        }
    }

    private string GetPath(string key) => Path.Combine(directory, Sanitize(key) + ".json");

    private static string Sanitize(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var chars = value.Select(character => invalid.Contains(character) || character is '/' or '\\' ? '_' : character).ToArray();
        return new string(chars).Trim();
    }
}

public sealed class MemoryStorage : IPluginStorage
{
    private readonly Dictionary<string, string> values = new(StringComparer.Ordinal);
    private readonly JsonSerializerOptions options = new() { Converters = { new JsonStringEnumConverter() } };

    public T Load<T>(string key, T fallback)
    {
        return values.TryGetValue(key, out var json)
            ? JsonSerializer.Deserialize<T>(json, options) ?? fallback
            : fallback;
    }

    public void Save<T>(string key, T value) => values[key] = JsonSerializer.Serialize(value, options);
    public void Delete(string key) => values.Remove(key);
}
