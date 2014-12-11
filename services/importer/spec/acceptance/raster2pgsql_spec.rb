# encoding: utf-8
require_relative '../../lib/importer/raster2pgsql'

include CartoDB::Importer2

describe 'raster2pgsql acceptance tests' do

  before(:all) do
    @table_name = 'raster_test'
    @filepath = File.expand_path(File.join(File.dirname(__FILE__), "../fixtures/raster_simple.tif"))
    @pg_options = {}
  end

  # TODO: TempFile for other tests who operate with the file


  it 'tests extracting size from a tif' do
    expected_size = [2052, 1780]

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, @pg_options)

    size = rasterizer.send(:extract_raster_size)
    size.should eq expected_size
  end

  it 'tests calculating overviews' do
    raster_1_size = [16200, 8100]
    expected_overviews_1 = '2,4,8,16,32,64,128'
    expected_additional_tables_1 = [ "o_2_raster_test", "o_4_raster_test", "o_8_raster_test", "o_16_raster_test", \
                                     "o_32_raster_test", "o_64_raster_test", "o_128_raster_test" ]
    raster_2_size = [1024, 32]
    expected_overviews_2 = '2,4,8'
    expected_additional_tables_2 = [ "o_2_raster_test", "o_4_raster_test", "o_8_raster_test" ]
    raster_3_size = [1620000, 810000]
    expected_overviews_3 = '2,4,8,16,32,64,128,256,512'
    expected_additional_tables_3 = [ "o_2_raster_test", "o_4_raster_test", "o_8_raster_test", "o_16_raster_test", \
                                     "o_32_raster_test", "o_64_raster_test", "o_128_raster_test", \
                                     "o_256_raster_test", "o_512_raster_test" ]

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, @pg_options)

    overviews = rasterizer.send(:calculate_raster_overviews, raster_1_size)
    overviews.should eq expected_overviews_1
    rasterizer.additional_support_tables.should eq expected_additional_tables_1

    overviews = rasterizer.send(:calculate_raster_overviews, raster_2_size)
    overviews.should eq expected_overviews_2
    rasterizer.additional_support_tables.should eq expected_additional_tables_2

    overviews = rasterizer.send(:calculate_raster_overviews, raster_3_size)
    overviews.should eq expected_overviews_3
    rasterizer.additional_support_tables.should eq expected_additional_tables_3
  end

  it 'tests calculating raster scale' do
    pixel_size = 3667.822831377844

    rasterizer = Raster2Pgsql.new(@table_name, @filepath, @pg_options)

    scale = rasterizer.send(:calculate_raster_scale, pixel_size)
    # 4891.480651647949  but just in case decimals change
    scale.should > 4891
    scale.should < 4892
  end

end
 