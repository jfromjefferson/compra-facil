import { useEffect, useState } from "react";

export function App() {
	const [invoiceKey, setInvoiceKey] = useState("")
	const [products, setProducts] = useState<string[]>()
	const [checked, setChecked] = useState<boolean[]>([])

	async function getInvoice() {
		if (!invoiceKey) {
			alert("Por favor, insira a chave da nota fiscal.")
			return
		}

		const invoiceKeyPattern = /^\d{44}$/
		if (!invoiceKeyPattern.test(invoiceKey)) {
			alert("Chave da nota fiscal inválida. Deve conter 44 dígitos.")
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
			const uniqueProducts = new Set()

			rows.forEach(row => {
				const cells = row.querySelectorAll('td')
				const product = cells[1]?.textContent?.trim() || ''
				uniqueProducts.add(product)
			})

			const productArray = Array.from(uniqueProducts) as string[]
			sessionStorage.setItem('products', JSON.stringify(productArray))
			setProducts(productArray)
			setChecked(productArray.map(() => false))
		} catch (error) {
			alert("Erro ao conectar ao servidor. Por favor, tente novamente mais tarde.")
			return
		}
	}

	function getProductsFromStorage() {
		const products = sessionStorage.getItem('products')
		const storedProducts = products ? JSON.parse(products) : []

		return storedProducts.sort()
	}

	function removeProduct(index: number) {
		if (!products) return

		const updatedProducts = products.filter((_, i) => i !== index)
		sessionStorage.setItem('products', JSON.stringify(updatedProducts))
		setProducts(updatedProducts)
		//setChecked(updatedProducts.map(() => false))
	}

	useEffect(() => {
		const storedProducts = getProductsFromStorage()
		setProducts(storedProducts)
		setChecked(storedProducts.map(() => false))
	}, [])

	function toggleChecked(index: number) {
		setChecked(prev => {
			const copy = [...prev]
			copy[index] = !copy[index]
			return copy
		})
	}

	return (
		<main>
			<div className={`formArea ${products ? 'hide' : ''}`}>
				<h1>Compra fácil</h1>
				<p className="description">
					Monte sua lista de compras a partir das notas fiscais de suas compras anteriores.
				</p>
				<form>
					<input type="text" placeholder="Chave da nota fiscal" value={invoiceKey} onChange={e => setInvoiceKey(e.target.value)} />
					<button type="button" onClick={getInvoice}>Buscar</button>
				</form>
			</div>

			<div className={`productArea ${products ? 'show' : 'hide'}`}>
				<h2>Produtos encontrados:</h2>
				{products && products.map((product, index) => (
					<div className="item" key={index}>
						<span className="productName" onClick={() => toggleChecked(index)}>{product}</span>
						<div className="itemButtonsArea">
							<button
								type="button"
								className="removeItem"
								onClick={() => removeProduct(index)}>
									Remover
								</button>
							<input
								type="checkbox"
								checked={!!checked[index]}
								onChange={() => toggleChecked(index)}
							/>
						</div>
					</div>
				))}
			</div>
		</main>
	)
}