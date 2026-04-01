import { Dimensions, Platform, View } from "react-native";

import { PieChart as NativePieChart } from "react-native-chart-kit";

// 👉 Recharts nur für Web laden
let WebPieChart: any;
let WebPie: any;
let WebCell: any;

if (Platform.OS === "web") {
  const recharts = require("recharts");
  WebPieChart = recharts.PieChart;
  WebPie = recharts.Pie;
  WebCell = recharts.Cell;
}

// 👉 Types
type PieDataItem = {
  name: string;
  value: number;
};

type Props = {
  data: PieDataItem[];
  isAnimationActive?: boolean;
};

const COLORS = ["#00C49F", "#fa1c1c"];
const RADIAN = Math.PI / 180;

// 👉 Custom Label (nur Web sinnvoll)
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (!cx || !cy || !innerRadius || !outerRadius) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = cy + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PieChartWithCustomizedLabel({
  data,
  isAnimationActive = true,
}: Props) {
  // 📱 MOBILE (react-native-chart-kit)
  if (Platform.OS !== "web") {
    const screenWidth = Dimensions.get("window").width;

    const formattedData = data.map((item, index) => ({
      name: item.name,
      population: item.value,
      color: COLORS[index % COLORS.length],
      legendFontColor: "#333",
      legendFontSize: 12,
    }));

    return (
      <NativePieChart
        data={formattedData}
        width={screenWidth - 20}
        height={220}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          color: () => "#000",
        }}
      />
    );
  }

  // 🌐 WEB (Recharts)
  return (
    <View style={{ alignItems: "center" }}>
      <WebPieChart width={300} height={300}>
        <WebPie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
          isAnimationActive={isAnimationActive}
        >
          {data.map((entry, index) => (
            <WebCell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </WebPie>
      </WebPieChart>
    </View>
  );
}