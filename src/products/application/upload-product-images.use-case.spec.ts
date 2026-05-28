import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UploadProductImagesUseCase } from './upload-product-images.use-case';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.interface';
import { SupabaseService } from '../../supabase/supabase.service';

describe('UploadProductImagesUseCase — HUMP04', () => {
  let useCase: UploadProductImagesUseCase;

  const mockProductRepository = {
    findById: jest.fn(),
    addImage: jest.fn(),
  };

  const mockSupabaseService = {
    adminClient: {
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadProductImagesUseCase,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    useCase = module.get<UploadProductImagesUseCase>(UploadProductImagesUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería lanzar NotFoundException si el producto no existe', async () => {
    mockProductRepository.findById.mockResolvedValue(null);
    const mockFile = { originalname: 'test.png', buffer: Buffer.from('') } as any;

    await expect(useCase.execute('inv', mockFile)).rejects.toThrow(NotFoundException);
  });

  it('CA6 — debería subir imagen y devolverla', async () => {
    const id = 'prod-1';
    mockProductRepository.findById.mockResolvedValue({ id });
    const mockFile = { originalname: 'test.png', buffer: Buffer.from(''), mimetype: 'image/png' } as any;

    mockSupabaseService.adminClient.storage.upload.mockResolvedValue({ error: null });
    mockSupabaseService.adminClient.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://img.com/test.png' } });
    mockProductRepository.addImage.mockResolvedValue({ id: 'img-1', url: 'http://img.com/test.png' });

    const result = await useCase.execute(id, mockFile);

    expect(mockSupabaseService.adminClient.storage.upload).toHaveBeenCalled();
    expect(mockProductRepository.addImage).toHaveBeenCalledWith(id, null, 'http://img.com/test.png');
    expect(result).toEqual({ id: 'img-1', url: 'http://img.com/test.png' });
  });

  it('debería lanzar Error si la subida falla', async () => {
    mockProductRepository.findById.mockResolvedValue({ id: '1' });
    const mockFile = { originalname: 'test.png', buffer: Buffer.from(''), mimetype: 'image/png' } as any;

    mockSupabaseService.adminClient.storage.upload.mockResolvedValue({ error: { message: 'Upload Failed' } });

    await expect(useCase.execute('1', mockFile)).rejects.toThrow('Error subiendo imagen: Upload Failed');
  });
});
