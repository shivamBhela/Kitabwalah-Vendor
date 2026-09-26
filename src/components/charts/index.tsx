// ─── Revenue Line Chart ───────────────────────────────────────────────────────

export function RevenueChart() {
  return (
    <div className="revenue-chart">
      <div className="y-axis">
        <span>₹20k</span>
        <span>₹15k</span>
        <span>₹10k</span>
        <span>₹5k</span>
        <span>₹0</span>
      </div>
      <svg viewBox="0 0 660 210" preserveAspectRatio="none" aria-label="Revenue chart">
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#1c6b58" stopOpacity=".24" />
            <stop offset="1" stopColor="#1c6b58" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="grid"
          d="M0 8H660M0 58H660M0 108H660M0 158H660M0 208H660"
        />
        <path
          className="area"
          d="M0 175 C30 162 47 170 66 151 S100 148 121 137 S146 160 169 142
             S202 92 223 111 S251 120 275 105 S301 138 326 118 S352 79 376 91
             S403 101 428 70 S453 108 478 86 S504 52 528 64 S555 77 579 42
             S611 57 660 20 L660 210 L0 210 Z"
        />
        <path
          className="line"
          d="M0 175 C30 162 47 170 66 151 S100 148 121 137 S146 160 169 142
             S202 92 223 111 S251 120 275 105 S301 138 326 118 S352 79 376 91
             S403 101 428 70 S453 108 478 86 S504 52 528 64 S555 77 579 42
             S611 57 660 20"
        />
      </svg>
      <div className="x-axis">
        <span>Aug 08</span>
        <span>Aug 14</span>
        <span>Aug 20</span>
        <span>Aug 26</span>
        <span>Sep 01</span>
        <span>Sep 06</span>
      </div>
    </div>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

const BAR_DATA = [42, 58, 35, 72, 48, 82, 67, 92, 62, 78, 88, 100]

export function Bars() {
  return (
    <div className="bars">
      {BAR_DATA.map((x, i) => (
        <span key={i} style={{ height: `${x}%` }} />
      ))}
    </div>
  )
}
