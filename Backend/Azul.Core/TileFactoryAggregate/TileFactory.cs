using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TileFactory : ITileFactory
{
    private readonly List<IFactoryDisplay> _displays;
    private readonly List<TileType> _usedTiles;
    private readonly ITileBag _bag;
    private readonly ITableCenter _tableCenter;
    internal TileFactory(int numberOfDisplays, ITileBag bag)
    {
        _bag = bag;
        _usedTiles = new List<TileType>();
        _tableCenter = new TableCenter();
        _displays = new List<IFactoryDisplay>();

        for (int i = 0; i < numberOfDisplays; i++)
        {
            _displays.Add(new FactoryDisplay(_tableCenter));
        }
    }

    public ITileBag Bag => _bag;

    public IReadOnlyList<IFactoryDisplay> Displays => _displays.AsReadOnly();

    public ITableCenter TableCenter => _tableCenter;

    public IReadOnlyList<TileType> UsedTiles => _usedTiles.AsReadOnly();

    public bool IsEmpty
    {
        get
        {
            if (_displays.Any(d => !d.IsEmpty))
            {
                return false;
            }
            if (!_tableCenter.IsEmpty)
            {
                return false;
            }
            return true;
        }
    }

    public void FillDisplays()
    {
        foreach (var display in _displays)
        {
            ClearDisplay(display);

            // Try to take 4 tiles for this display
            if (!_bag.TryTakeTiles(4, out var tiles) || tiles.Count < 4)
            {
                // If not enough tiles, and there are used tiles, refill the bag
                int missing = 4 - (tiles?.Count ?? 0);
                var currentTiles = tiles?.ToList() ?? new List<TileType>();

                if (_usedTiles.Count > 0)
                {
                    _bag.AddTiles(_usedTiles);
                    _usedTiles.Clear();

                    // Only take the missing amount
                    if (_bag.TryTakeTiles(missing, out var refillTiles) && refillTiles.Count > 0)
                    {
                        currentTiles.AddRange(refillTiles);
                    }
                }

                display.AddTiles(currentTiles);
            }
            else
            {
                display.AddTiles(tiles);
            }
        }
    }

    public IReadOnlyList<TileType> TakeTiles(Guid displayId, TileType tileType)
    {
        // 1. Find the display or table center
        IFactoryDisplay display = _displays.FirstOrDefault(d => d.Id == displayId);
        if (display == null)
        {
            if (_tableCenter.Id == displayId)
            {
                display = _tableCenter;
            }
            else
            {
                throw new InvalidOperationException("Display does not exist.");
            }
        }

        // 2. Check if the tileType is present in the display/table center
        if (!display.Tiles.Contains(tileType))
        {
            throw new InvalidOperationException("The requested tile is not in the display.");
        }

        // 3. If taking from table center: take all of that type + starting tile (if present)
        if (display == _tableCenter)
        {
            var takenTiles = display.Tiles.Where(t => t == tileType).ToList();

            // Only add the starting tile if it is present AND the selected type is NOT StartingTile
            if (_tableCenter.HasStartingTile)
            {
                if (tileType != TileType.StartingTile)
                {
                    takenTiles.Add(TileType.StartingTile);
                }
                _tableCenter.RemoveStartingTile(); // Remove the starting tile from center
            }

            display.RemoveTiles(tileType); // Remove all of the selected type

            return takenTiles;
        }
        else
        {
            // 4. If taking from a factory display
            var takenTiles = display.Tiles.Where(t => t == tileType).ToList();
            var movedTiles = display.Tiles.Where(t => t != tileType).ToList();

            // Move other tiles to the table center
            if (movedTiles.Any())
            {
                _tableCenter.AddTiles(movedTiles);
            }

            // Remove all tiles from the display
            display.ClearTiles();

            return takenTiles;
        }
    }



    public void AddToUsedTiles(TileType tile)
    {
        _usedTiles.Add(tile);
    }

    private void ClearDisplay(IFactoryDisplay display)
    {
        var uniqueTypes = display.Tiles.Distinct().ToList();
        foreach (var type in uniqueTypes)
        {
            display.TakeTiles(type);
        }
    }
}