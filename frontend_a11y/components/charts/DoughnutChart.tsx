'use client'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export const DoughnutChart = ({ data, options }: { data: any; options: any }) => {
    return <Doughnut data={data} options={options} />
}
