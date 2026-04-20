import { View, Text } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

export type ChartPoint = {
  label: string;
  value: number;
};

type LineChartProps = {
  data: ChartPoint[];
  color: string;
  height?: number;
  width?: number;
  yLabel?: string;
};

export function LineChart({
  data,
  color,
  height = 200,
  width = 320,
  yLabel,
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <View
        style={{
          height,
          width,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#52525B', fontSize: 13, fontStyle: 'italic' }}>
          No data yet
        </Text>
      </View>
    );
  }

  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const pad = maxV - minV < 1 ? 1 : (maxV - minV) * 0.1;
  const yMin = Math.max(0, minV - pad);
  const yMax = maxV + pad;
  const yRange = yMax - yMin || 1;

  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

  const toX = (i: number) => padL + i * stepX;
  const toY = (v: number) => padT + chartH - ((v - yMin) / yRange) * chartH;

  const pointsPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(d.value)}`)
    .join(' ');

  const areaPath =
    data.length > 1
      ? `${pointsPath} L ${toX(data.length - 1)} ${padT + chartH} L ${padL} ${
          padT + chartH
        } Z`
      : '';

  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  return (
    <View>
      {yLabel ? (
        <Text
          style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: '700',
            marginBottom: 8,
          }}
        >
          {yLabel}
        </Text>
      ) : null}
      <Svg width={width} height={height}>
        {yTicks.map((tick, i) => (
          <Line
            key={`grid-${i}`}
            x1={padL}
            y1={toY(tick)}
            x2={padL + chartW}
            y2={toY(tick)}
            stroke="#1F1F1F"
            strokeWidth={1}
          />
        ))}
        {yTicks.map((tick, i) => (
          <SvgText
            key={`yl-${i}`}
            x={padL - 8}
            y={toY(tick) + 4}
            fill="#52525B"
            fontSize={10}
            textAnchor="end"
          >
            {formatTick(tick)}
          </SvgText>
        ))}
        {data.length > 1 ? (
          <Path d={areaPath} fill={color} fillOpacity={0.15} />
        ) : null}
        {data.length > 1 ? (
          <Path d={pointsPath} stroke={color} strokeWidth={2} fill="none" />
        ) : null}
        {data.map((d, i) => (
          <Circle
            key={`pt-${i}`}
            cx={toX(i)}
            cy={toY(d.value)}
            r={3.5}
            fill={color}
          />
        ))}
        {data.length > 0 ? (
          <>
            <SvgText
              x={padL}
              y={height - 8}
              fill="#52525B"
              fontSize={10}
              textAnchor="start"
            >
              {data[0].label}
            </SvgText>
            <SvgText
              x={padL + chartW}
              y={height - 8}
              fill="#52525B"
              fontSize={10}
              textAnchor="end"
            >
              {data[data.length - 1].label}
            </SvgText>
          </>
        ) : null}
      </Svg>
    </View>
  );
}

function formatTick(v: number) {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 100) / 10}k`;
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1).replace(/\.0$/, '');
}
