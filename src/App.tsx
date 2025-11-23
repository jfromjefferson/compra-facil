import { useCallback, useEffect, useMemo, useState } from "react";

export function App() {
	const [invoiceKey, setInvoiceKey] = useState("")
	const [products, setProducts] = useState<string[]>([])

	async function getInvoice() {
		if (!invoiceKey) {
			alert("Por favor, insira a chave da nota fiscal.")
			return
		}

		const invoiceKeyPattern = /^\d{44}$/
		if (!invoiceKeyPattern.test(invoiceKey)) {
			alert("Chave da nota fiscal inválida. Deve conter 44 dígitos.")
			setInvoiceKey("")
			return
		}

		const url = '/sat-proxy'
		const params = new URLSearchParams()
		params.append('HML', 'false')
		params.append('chaveNFe', invoiceKey)

		try {
			const response = await fetch(url, {
				method: 'POST',
				body: params.toString(),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
				}
			})

			const text = await response.text()
			const parser = new DOMParser()
			const doc = parser.parseFromString(text, 'text/html')
			const responseTable = doc.querySelector('#respostaWS')?.querySelectorAll('.NFCCabecalho') || []

			if (!responseTable.length) {
				alert("Nenhum dado encontrado para a chave da nota fiscal fornecida.")
				return
			}

			const productTable = responseTable[3]
			const rows = productTable?.querySelectorAll('tr[id]') || []
			const uniqueProducts = new Set<string>()

			rows.forEach(row => {
				const cells = row.querySelectorAll('td')
				const product = cells[1]?.textContent?.trim() || ''
				if (product) uniqueProducts.add(product)
			})

			const productArray = Array.from(uniqueProducts).sort() as string[]
			sessionStorage.setItem('products', JSON.stringify(productArray))
			setProducts(productArray)
			setInvoiceKey("")
		} catch (error) {
			alert("Erro ao conectar ao servidor. Por favor, tente novamente mais tarde.")
			return
		}
	}

	function getProductsFromStorage() {
		const raw = sessionStorage.getItem('products')
		const storedProducts = raw ? (JSON.parse(raw) as string[]) : []
		return storedProducts
	}

	const removeProduct = useCallback((productToRemove: string) => {
		setProducts(prev => {
			const updated = prev.filter(product => product !== productToRemove)
			sessionStorage.setItem('products', JSON.stringify(updated))
			return updated
		})
	}, [])

	useEffect(() => {
		const storedProducts = getProductsFromStorage()
		setProducts(storedProducts)
	}, [])

	const sortedProducts = useMemo(() => {
		return [...products].sort()
	}, [products])

	return (
		<main>
			<div className={`formArea ${products?.length ? 'hide' : ''}`}>
				<h1>Compra fácil</h1>
				<p className="description">
					Monte sua lista de compras a partir das notas fiscais de suas compras anteriores.
				</p>
				<form>
					<input type="text" placeholder="Chave da nota fiscal" value={invoiceKey} onChange={e => setInvoiceKey(e.target.value)} />
					<button type="button" onClick={getInvoice}>Buscar</button>
				</form>
			</div>

			<div className={`productArea ${products?.length ? 'show' : 'hide'}`}>
				<div className="header">
					<h2>Produtos encontrados:</h2>
					<button type="button" className="clearList" onClick={() => {
						sessionStorage.removeItem('products')
						setProducts([])
					}}>
						Limpar lista
					</button>
				</div>
				{sortedProducts.map((product) => (
					<div className="item" key={product}>
						<span className="productName">{product}</span>
						<div className="itemButtonsArea">
							<button
								type="button"
								className="removeItem"
								onClick={() => removeProduct(product)}>
								Remover
							</button>
						</div>
					</div>
				))}
			</div>
		</main>
	)
}