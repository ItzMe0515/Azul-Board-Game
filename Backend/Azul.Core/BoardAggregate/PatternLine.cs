using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.BoardAggregate;

/// <inheritdoc cref="IPatternLine"/>
internal class PatternLine : IPatternLine
{
    public int Length { get; }
    public TileType? TileType { get; private set; }
    public int NumberOfTiles { get; private set; }

    public bool IsComplete => NumberOfTiles == Length;

    public PatternLine(int length)
    {
        Length = length;
        TileType = null;
        NumberOfTiles = 0;
    }

    public void Clear()
    {
        TileType = null;
        NumberOfTiles = 0;
    }

    public void TryAddTiles(TileType type, int numberOfTilesToAdd, out int remainingNumberOfTiles)
    {
        if (IsComplete)
        {
            throw new InvalidOperationException("Pattern line is already complete.");
        }

        if (TileType != null && TileType != type)
        {
            throw new InvalidOperationException("Pattern line already contains tiles of another type.");
        }

        if (TileType == null)
        {
            TileType = type;
        }

        int spaceLeft = Length - NumberOfTiles;
        int toAdd = Math.Min(spaceLeft, numberOfTilesToAdd);
        NumberOfTiles += toAdd;
        remainingNumberOfTiles = numberOfTilesToAdd - toAdd;
    }
}