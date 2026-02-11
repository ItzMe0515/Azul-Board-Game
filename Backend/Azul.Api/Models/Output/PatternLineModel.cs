using AutoMapper;
using Azul.Core.BoardAggregate.Contracts;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class PatternLineModel
{
    public int Length { get; set; }
    public TileType? TileType { get; set; }
    public int NumberOfTiles { get; set; }
    public bool IsComplete { get; set; }
    public List<TileType> Tiles { get; set; }
}

public class PatternLineModelMappingProfile : Profile
{
    public PatternLineModelMappingProfile()
    {
        CreateMap<IPatternLine, PatternLineModel>()
            .ForMember(dest => dest.TileType, opt => opt.MapFrom(src => src.TileType))
            .ForMember(dest => dest.Tiles, opt => opt.MapFrom(src =>
                src.TileType.HasValue && src.NumberOfTiles > 0
                    ? Enumerable.Repeat(src.TileType.Value, src.NumberOfTiles).ToList()
                    : new List<TileType>()));

    }
}


