using System;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;

namespace Hyv.Services
{
    public interface IPhotoService
    {
        Task<string> UploadPhotoAsync(IFormFile file);
        Task<string> UploadPhotoAsync(IFormFile file, string publicId);
        Task<bool> DeletePhotoAsync(string publicId);
    }

    public class PhotoService : IPhotoService
    {
        private readonly Cloudinary _cloudinary;

        public PhotoService(Cloudinary cloudinary)
        {
            _cloudinary = cloudinary;
        }

        public async Task<string> UploadPhotoAsync(IFormFile file)
        {
            return await UploadPhotoAsync(file, null);
        }

        public async Task<string> UploadPhotoAsync(IFormFile file, string publicId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided");

            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Transformation = new Transformation()
                    .Width(500)
                    .Height(500)
                    .Crop("fill")
                    .Gravity("face"),
            };

            if (!string.IsNullOrEmpty(publicId))
            {
                uploadParams.PublicId = publicId;
            }

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
            {
                throw new Exception(uploadResult.Error.Message);
            }

            return uploadResult.SecureUrl.ToString();
        }

        public async Task<bool> DeletePhotoAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId))
                return false;

            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);

            return result.Result == "ok";
        }
    }
}
