using System.Reflection;
using WorkRoll.Core;

var tests = new (string Name, Action Run)[]
{
    ("D20 结果映射", TestD20Mapping),
    ("D20 点数范围", TestD20Range),
    ("本地存储往返", TestStorageRoundTrip),
    ("插件发现与启停", TestDiscoveryAndToggle),
    ("插件存储命名空间隔离", TestStorageNamespaces)
};

var failures = new List<string>();
foreach (var test in tests)
{
    try
    {
        test.Run();
        Console.WriteLine($"PASS  {test.Name}");
    }
    catch (Exception exception)
    {
        failures.Add($"{test.Name}: {exception.Message}");
        Console.WriteLine($"FAIL  {test.Name}: {exception.Message}");
    }
}

Console.WriteLine($"\n{tests.Length - failures.Count}/{tests.Length} tests passed.");
if (failures.Count > 0) Environment.ExitCode = 1;

static void TestD20Mapping()
{
    Assert(RollResult.FromValue(20).Kind == RollKind.CriticalSuccess, "20 应为大成功");
    Assert(RollResult.FromValue(20).Title == "大成功", "20 文案不正确");
    Assert(RollResult.FromValue(1).Kind == RollKind.CriticalFailure, "1 应为大失败");
    Assert(RollResult.FromValue(1).Title == "大失败", "1 文案不正确");
    Assert(RollResult.FromValue(2).Kind == RollKind.Standard, "2 应为普通结果");
    Assert(RollResult.FromValue(19).Kind == RollKind.Standard, "19 应为普通结果");
    AssertThrows(() => RollResult.FromValue(0));
    AssertThrows(() => RollResult.FromValue(21));
}

static void TestD20Range()
{
    for (var i = 0; i < 500; i++) Assert(D20Rules.IsValidValue(D20Rules.Roll()), "安全随机结果越界");
}

static void TestStorageRoundTrip()
{
    var directory = Path.Combine(Path.GetTempPath(), "workroll-tests-" + Guid.NewGuid().ToString("N"));
    try
    {
        var storage = new JsonFileStorage(directory, "d20");
        var records = new[] { new RollRecord(Guid.NewGuid(), "写完周报", 20, RollKind.CriticalSuccess, DateTimeOffset.UtcNow) };
        storage.Save("history", records);
        var loaded = storage.Load("history", Array.Empty<RollRecord>());
        Assert(loaded.Length == 1 && loaded[0].Subject == "写完周报" && loaded[0].Value == 20, "记录未正确保存或读取");
        storage.Delete("history");
        Assert(storage.Load("history", Array.Empty<RollRecord>()).Length == 0, "删除记录失败");
    }
    finally { if (Directory.Exists(directory)) Directory.Delete(directory, true); }
}

static void TestDiscoveryAndToggle()
{
    var plugins = PluginDiscovery.Discover(Assembly.GetExecutingAssembly());
    Assert(plugins.Count == 1 && plugins[0].Manifest?.Id == "test-plugin", "没有发现测试插件");
    var store = new PluginStateStore(new MemoryStorage());
    var enabled = store.LoadEnabled(plugins);
    Assert(enabled.Contains("test-plugin"), "默认启用状态未加载");
    enabled.Remove("test-plugin");
    store.SaveEnabled(enabled);
    var restored = store.LoadEnabled(plugins);
    Assert(!restored.Contains("test-plugin"), "停用状态未持久化");
}

static void TestStorageNamespaces()
{
    var directory = Path.Combine(Path.GetTempPath(), "workroll-ns-" + Guid.NewGuid().ToString("N"));
    try
    {
        var first = new JsonFileStorage(directory, "plugin-a");
        var second = new JsonFileStorage(directory, "plugin-b");
        first.Save("value", "a");
        second.Save("value", "b");
        Assert(first.Load("value", "") == "a" && second.Load("value", "") == "b", "插件命名空间互相覆盖");
    }
    finally { if (Directory.Exists(directory)) Directory.Delete(directory, true); }
}

static void Assert(bool condition, string message)
{
    if (!condition) throw new InvalidOperationException(message);
}

static void AssertThrows(Action action)
{
    try { action(); throw new InvalidOperationException("应抛出参数异常"); }
    catch (ArgumentOutOfRangeException) { }
}

public sealed class TestPlugin : IWorkRollPlugin
{
    public PluginManifest Manifest { get; } = new(
        "test-plugin", "测试插件", "用于验证宿主发现能力", "✓", "0.1.0", typeof(TestPlugin).FullName!, Array.Empty<string>(), true);
}
