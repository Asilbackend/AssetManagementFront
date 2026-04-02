import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AssetForm } from '../components/assets/AssetForm'
import { PageHeader } from '../components/layout/PageHeader'
import { useAssetStore } from '../context/AssetContext'

export function EditAssetPage() {
  const navigate = useNavigate()
  const { assetId = '' } = useParams()
  const { assets, getAssetById, updateAsset } = useAssetStore()
  const asset = getAssetById(assetId)

  if (!asset) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asset edit"
        title="Existing assetni category type bilan tahrirlash"
        description="Category type o'zgarsa, category va asset type variantlari darhol yangilanadi. Saqlash vaqtida store darajasida ham moslik va sotib olingan narx tekshiriladi."
        rightSlot={
          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Editing: {asset.assetCode}
          </div>
        }
      />

      <AssetForm
        mode="edit"
        assets={assets}
        initialAsset={asset}
        submitLabel="O'zgarishlarni saqlash"
        onSubmit={(payload) => {
          updateAsset(asset.id, payload)
          navigate('/')
        }}
      />
    </div>
  )
}
