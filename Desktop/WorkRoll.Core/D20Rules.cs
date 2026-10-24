using System.Security.Cryptography;

namespace WorkRoll.Core;

public enum RollKind
{
    Standard,
    CriticalSuccess,
    CriticalFailure
}

public sealed record RollResult(int Value, RollKind Kind, string Title, string Description)
{
    public static RollResult FromValue(int value) => value switch
    {
        20 => new(20, RollKind.CriticalSuccess, "大成功", "今天的工作值得全力推进。"),
        1 => new(1, RollKind.CriticalFailure, "大失败", "先停一下，换个更小的第一步。"),
        >= 2 and <= 19 => new(value, RollKind.Standard, "普通结果", "不必等到完美，现在就开始。"),
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, "D20 点数必须在 1 到 20 之间。")
    };
}

public static class D20Rules
{
    public static int Roll() => RandomNumberGenerator.GetInt32(1, 21);

    public static RollResult RollResult() => global::WorkRoll.Core.RollResult.FromValue(Roll());

    public static bool IsValidValue(int value) => value is >= 1 and <= 20;
}

public sealed record RollRecord(Guid Id, string Subject, int Value, RollKind Kind, DateTimeOffset AtUtc);
