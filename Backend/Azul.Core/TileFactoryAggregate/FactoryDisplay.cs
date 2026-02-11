using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class FactoryDisplay : IFactoryDisplay
{

    private readonly List<TileType> _tiles = new List<TileType>();
    private readonly ITableCenter _tableCenter;

    public Guid Id { get; } = Guid.NewGuid();

    public IReadOnlyList<TileType> Tiles => _tiles.AsReadOnly();

    public bool IsEmpty => _tiles.Count == 0;

    public FactoryDisplay(ITableCenter tableCenter)
    {
        //FYI: The table center is injected to be able to move tiles (that were not taken by a player) to the center

        _tableCenter = tableCenter;
    }

    public void AddTiles(IReadOnlyList<TileType> tilesToAdd)
    {
        _tiles.AddRange(tilesToAdd);
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        var taken = _tiles.Where(t => t == tileType).ToList();

        var remaining = _tiles.Where(t => t != tileType).ToList();
        if(remaining.Count > 0)
        {
            _tableCenter.AddTiles(remaining);
        }

        _tiles.Clear();

        return taken;
    }

    public void ClearTiles()
    {
        _tiles.Clear();
    }

    public void RemoveTiles(TileType tileType)
    {
        _tiles.RemoveAll(t => t == tileType);
    }

}