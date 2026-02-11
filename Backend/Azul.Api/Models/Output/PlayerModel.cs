using AutoMapper;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.PlayerAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;
using Azul.Core.BoardAggregate;
using Azul.Core.PlayerAggregate;

namespace Azul.Api.Models.Output;

public class PlayerModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public DateOnly? LastVisitToPortugal { get; set; }
    public BoardModel Board { get; set; }
    public bool HasStartingTile { get; set; }
    public List<TileType> TilesToPlace { get; set; }
}

public class PlayerModelMappingProfile : Profile
{
    public PlayerModelMappingProfile()
    {
        CreateMap<IPlayer, PlayerModel>()
            .ForMember(dest => dest.TilesToPlace, opt => opt.MapFrom(src => src.TilesToPlace.Select(t => t.ToString()).ToList()))
            .ForMember(dest => dest.Board, opt => opt.MapFrom(src => src.Board));
    }
}

