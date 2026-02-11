using Azul.Core.GameAggregate.Contracts;
using Azul.Core.PlayerAggregate;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Core.GameAggregate;

/// <inheritdoc cref="IGame"/>
internal class Game : IGame
{
    /// <summary>
    /// Creates a new game and determines the player to play first.
    /// </summary>
    /// <param name="id">The unique identifier of the game</param>
    /// <param name="tileFactory">The tile factory</param>
    /// <param name="players">The players that will play the game</param>
    /// 
    public Guid Id { get; }
    public ITileFactory TileFactory { get; }
    public IPlayer[] Players { get; }
    public Guid PlayerToPlayId { get; private set; }
    public int RoundNumber { get; private set; }
    public bool HasEnded { get; private set; }
    public Game(Guid id, ITileFactory tileFactory, IPlayer[] players)
    {
        Id = id;
        TileFactory = tileFactory;
        Players = players;
        RoundNumber = 1;
        HasEnded = false;

        IPlayer starter;
        if (players.All(p => p.LastVisitToPortugal == null) ||
            players.Select(p => p.LastVisitToPortugal).Distinct().Count() == 1)
        {
            starter = players[0];
        }
        else
        {
            starter = players
                .OrderByDescending(p => p.LastVisitToPortugal ?? DateOnly.MinValue)
                .First();
        }
        PlayerToPlayId = starter.Id;


        foreach (var player in Players)
        {
            player.HasStartingTile = false;
        }

        TileFactory.TableCenter.AddStartingTile();  

        TileFactory.FillDisplays();
    }

    public void TakeTilesFromFactory(Guid playerId, Guid displayId, TileType tileType)
    {
        if (playerId != PlayerToPlayId)
            throw new InvalidOperationException("It's not your turn.");

        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) throw new InvalidOperationException("Player not found.");

        if (player.TilesToPlace.Count > 0)
            throw new InvalidOperationException("You must place your tiles before taking new ones.");

        // DELEGATE TO TILEFACTORY (not display)
        var takenTiles = TileFactory.TakeTiles(displayId, tileType);
        if (takenTiles == null || takenTiles.Count == 0)
            throw new InvalidOperationException("No tiles taken.");

        player.TilesToPlace.Clear();
        player.TilesToPlace.AddRange(takenTiles);

        // If the player took the starting tile, set flag
        if (takenTiles.Contains(TileType.StartingTile))
        {
            player.HasStartingTile = true;
        }
    }


    public void PlaceTilesOnPatternLine(Guid playerId, int patternLineIndex)
    {
        if (playerId != PlayerToPlayId)
            throw new InvalidOperationException("It's not your turn.");

        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) throw new InvalidOperationException("Player not found.");

        if (player.TilesToPlace.Count == 0)
            throw new InvalidOperationException("Player has no tiles to place.");

        // Place tiles on the pattern line (handles overflow to floorline, etc.)
        player.Board.AddTilesToPatternLine(player.TilesToPlace, patternLineIndex, TileFactory);

        player.TilesToPlace.Clear();
        NextTurn();

        CheckEndOfRoundAndHandle();
    }


    public void PlaceTilesOnFloorLine(Guid playerId)
    {
        if (playerId != PlayerToPlayId)
            throw new InvalidOperationException("It's not your turn.");

        var player = Players.FirstOrDefault(p => p.Id == playerId);
        if (player == null) throw new InvalidOperationException("Player not found.");

        if (player.TilesToPlace.Count == 0)
            throw new InvalidOperationException("Player has no tiles to place.");

        player.Board.AddTilesToFloorLine(player.TilesToPlace, TileFactory);

        player.TilesToPlace.Clear();
        NextTurn();

        CheckEndOfRoundAndHandle();
    }


    private void NextTurn()
    {
        // Bepaal de index van de huidige speler
        int idx = Array.FindIndex(Players, p => p.Id == PlayerToPlayId);
        int nextIdx = (idx + 1) % Players.Length;
        PlayerToPlayId = Players[nextIdx].Id;
    }

    private void CheckEndOfRoundAndHandle()
    {
        bool allTilesPlaced = Players.All(p => p.TilesToPlace.Count == 0);
        if (TileFactory.IsEmpty && allTilesPlaced)
        {
            foreach (var player in Players)
            {
                player.Board.DoWallTiling(TileFactory);
            }

            if (Players.Any(p => p.Board.HasCompletedHorizontalLine))
            {
                HasEnded = true;
                foreach (var player in Players)
                {
                    player.Board.CalculateFinalBonusScores();
                }
            }
            else
            {
                RoundNumber++;

                // Determine starter for next round BEFORE clearing HasStartingTile
                var starter = Players.FirstOrDefault(p => p.HasStartingTile);

                // Clear HasStartingTile for all players
                foreach (var player in Players)
                {
                    player.HasStartingTile = false;
                }

                // Fill displays first
                TileFactory.FillDisplays();

                // Now add the starting tile to the table center
                TileFactory.TableCenter.AddStartingTile();

                // Set the player to play
                PlayerToPlayId = starter?.Id ?? Players[0].Id;
            }
        }
    }
}
