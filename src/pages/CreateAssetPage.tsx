import { useNavigate } from 'react-router-dom'
import { AssetForm } from '../components/assets/AssetForm'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'

export function CreateAssetPage() {
  const navigate = useNavigate()
  const { assets, createAsset } = useAssetStore()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asset create"
        title="Category type → category → asset type"
        description="Yangi asset yaratishda avval category type tanlanadi, so'ngra shu type ichidagi category va asset type lar ko'rsatiladi. Omborchi son va sotib olingan narx kiritsa, tizim shu miqdorda bir xil asset yaratadi va faqat asset code tartib raqami bo'yicha o'zgaradi."
        rightSlot={
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Jami assetlar: {assets.length}
          </div>
        }
      />

      <AssetForm
        mode="create"
        assets={assets}
        submitLabel="Asset yaratish"
        onSubmit={(payload) => {
          createAsset(payload)
          navigate('/')
        }}
      />
    </div>
  )
}
