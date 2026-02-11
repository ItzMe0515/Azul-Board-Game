using AutoMapper;
using Azul.Core.TileFactoryAggregate.Contracts;

namespace Azul.Api.Models.Output;

public class TableCenterModel : FactoryDisplayModel
{
}

public class TableCenterModelMappingProfile : Profile
{
    public TableCenterModelMappingProfile()
    {
        CreateMap<ITableCenter, TableCenterModel>()
            .IncludeBase<IFactoryDisplay, FactoryDisplayModel>()
            .ForMember(dest => dest.Tiles, opt => opt.MapFrom(src => src.Tiles.Select(t => (int)t).ToList()));
    }
}

