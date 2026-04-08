import { useNavigate } from 'react-router-dom'
import { AssetForm } from '../components/assets/AssetForm'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'
import { useAppStore } from '../store/AppStore'

export function CreateAssetPage() {
  const navigate = useNavigate()
  const { assets, createAsset } = useAssetStore()
  const { data } = useAppStore()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Asset Create"
        title="Approved requestdan asset create qilish"
        description="Admin approved requestni tanlaydi, expected price requestdan olinadi va actual price real purchase sifatida saqlanadi. Hardware warehouse queue ga, software esa IT tayyorlash oqimiga tushadi."
        rightSlot={
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Jami assetlar: {assets.length}
          </div>
        }
      />

      <AssetForm
        mode="create"
        assets={assets}
        requests={data?.requests ?? []}
        submitLabel="Procurement asset yaratish"
        onSubmit={(payload) => {
          createAsset(payload)
          navigate('/admin')
        }}
      />
    </div>
  )
}
