using System.Reflection;

namespace WorkRoll.Core;

/// <summary>插件对宿主公开的稳定描述，后续可由目录或外部插件包提供。</summary>
public sealed record PluginManifest(
    string Id,
    string Name,
    string Description,
    string Icon,
    string Version,
    string EntryPoint,
    IReadOnlyList<string> Capabilities,
    bool DefaultEnabled = false);

public interface IPluginStorage
{
    T Load<T>(string key, T fallback);
    void Save<T>(string key, T value);
    void Delete(string key);
}

public interface IPluginHostContext
{
    string AppName { get; }
    string PluginId { get; }
    IPluginStorage Storage { get; }
    bool ReducedMotion { get; }
}

public interface IWorkRollPlugin
{
    PluginManifest Manifest { get; }
}

/// <summary>桌面 UI 插件实现这个接口；核心协议本身不依赖 WinForms。</summary>
public interface IPluginViewFactory
{
    object CreateView(IPluginHostContext host);
}

public sealed record DiscoveredPlugin(
    Type PluginType,
    IWorkRollPlugin? Instance,
    PluginManifest? Manifest,
    string? LoadError)
{
    public string Id => Manifest?.Id ?? PluginType.FullName ?? PluginType.Name;
    public bool IsLoaded => Instance is not null && Manifest is not null && LoadError is null;
}

public static class PluginDiscovery
{
    public static IReadOnlyList<DiscoveredPlugin> Discover(Assembly assembly)
    {
        var result = new List<DiscoveredPlugin>();
        Type[] types;
        try
        {
            types = assembly.GetTypes();
        }
        catch (ReflectionTypeLoadException exception)
        {
            types = exception.Types.Where(type => type is not null).Cast<Type>().ToArray();
        }

        foreach (var type in types
                     .Where(type => typeof(IWorkRollPlugin).IsAssignableFrom(type))
                     .Where(type => !type.IsAbstract && !type.IsInterface)
                     .OrderBy(type => type.FullName, StringComparer.Ordinal))
        {
            try
            {
                if (Activator.CreateInstance(type) is not IWorkRollPlugin plugin)
                {
                    result.Add(new DiscoveredPlugin(type, null, null, "插件没有提供可用的无参数入口。"));
                    continue;
                }

                ValidateManifest(plugin.Manifest);
                result.Add(new DiscoveredPlugin(type, plugin, plugin.Manifest, null));
            }
            catch (Exception exception)
            {
                result.Add(new DiscoveredPlugin(type, null, null, exception.Message));
            }
        }

        return result;
    }

    private static void ValidateManifest(PluginManifest manifest)
    {
        if (string.IsNullOrWhiteSpace(manifest.Id)) throw new InvalidOperationException("插件 id 不能为空。");
        if (string.IsNullOrWhiteSpace(manifest.Name)) throw new InvalidOperationException("插件名称不能为空。");
        if (string.IsNullOrWhiteSpace(manifest.Version)) throw new InvalidOperationException("插件版本不能为空。");
        if (string.IsNullOrWhiteSpace(manifest.EntryPoint)) throw new InvalidOperationException("插件入口不能为空。");
    }
}

public sealed class PluginStateStore
{
    private readonly IPluginStorage storage;
    private const string EnabledKey = "enabled-plugins";

    public PluginStateStore(IPluginStorage storage) => this.storage = storage;

    public HashSet<string> LoadEnabled(IEnumerable<DiscoveredPlugin> plugins)
    {
        var defaults = plugins.Where(plugin => plugin.Manifest?.DefaultEnabled == true).Select(plugin => plugin.Id);
        var saved = storage.Load(EnabledKey, Array.Empty<string>());
        var ids = saved.Length == 0 ? defaults : saved;
        var knownIds = plugins.Select(plugin => plugin.Id).ToHashSet(StringComparer.OrdinalIgnoreCase);
        return ids.Where(knownIds.Contains).ToHashSet(StringComparer.OrdinalIgnoreCase);
    }

    public void SaveEnabled(IEnumerable<string> ids) => storage.Save(EnabledKey, ids.Distinct(StringComparer.OrdinalIgnoreCase).ToArray());
}
