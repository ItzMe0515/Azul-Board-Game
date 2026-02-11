using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.TileFactoryAggregate;

internal class TableCenter : ITableCenter
{
    private readonly List<TileType> _tiles = new List<TileType>();
    private bool _hasStartingTile = false;

    public Guid Id { get; } = Guid.NewGuid();

    public IReadOnlyList<TileType> Tiles => _tiles.AsReadOnly();

    public bool HasStartingTile => _hasStartingTile;

    public void AddStartingTile()
    {
        if (!_tiles.Contains(TileType.StartingTile))
        {
            _tiles.Add(TileType.StartingTile);
        }
        _hasStartingTile = true;
    }

    public void RemoveStartingTile()
    {
        _tiles.RemoveAll(t => t == TileType.StartingTile);
        _hasStartingTile = false;
    }

    public void AddTiles(IReadOnlyList<TileType> tiles)
    {
        _tiles.AddRange(tiles);
    }

    public IReadOnlyList<TileType> TakeTiles(TileType tileType)
    {
        var taken = _tiles.FindAll(t => t == tileType);
        _tiles.RemoveAll(t => t == tileType);
        return taken;
    }

    public bool IsEmpty => _tiles.Count == 0;

    public void ClearTiles()
    {
        _tiles.Clear();
    }

    public void RemoveTiles(TileType tileType)
    {
        _tiles.RemoveAll(t => t == tileType);
    }

}