import Link from "next/link";

export default function StudioNotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='text-center'>
        <div className='text-6xl mb-4'>😕</div>
        <h1 className='text-xl font-bold text-gray-700 mb-2'>
          상품을 찾을 수 없습니다
        </h1>
        <Link
          href='/'
          className='mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800'
        >
          상품 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
