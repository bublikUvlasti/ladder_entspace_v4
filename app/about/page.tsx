'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AboutPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            О игре "Скифская Лестница"
          </h1>
          <p className="text-gray-400">Древняя игра стратегии и предвидения</p>
        </div>

        <div className="space-y-8">
          {/* 1. Легенда степей */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🏔️ 1. Легенда степей
            </h2>
            <p className="text-gray-300 leading-relaxed">
              В древней евразийской степи кочевали скифы — народ, который совмещал мобильность пастухов с технологическим изяществом мастеров-ювелиров. Их удивительная способность работать с золотом и бережно сохранять предметы на захоронениях в кургана оставила нам редкие артефакты, пережившие тысячи лет. Среди них археологи обнаружили по-настоящему аномальный объект: пятиметровую Деревянную лестницу, слишком громоздкую для кочевого быта. Тщательное изучение резных надписей показало, что лестница служила ареной выбора вождя. Два претендента, располагая равным запасом золота, сражались не силой оружия, а умением рассчитывать ресурсы и предугадывать намерения соперника. Тот, кому удавалось поднять Большой Камень на вершину лестницы, становился лидером племени и собирал вокруг себя самую многочисленную кочевую дружину.
            </p>
          </div>

          {/* 2. Начальный капитал и цель */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  💰 2. Начальный капитал и цель
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Современная версия ритуала воссоздаёт ту же механику в цифровом формате. Каждый участник получает на старт ровно пятьдесят золотых монет и видит Большой Камень, установленный в центре лестницы. До вершины — две ступени. Задача игрока — переместить Камень на последнюю ступень в свою сторону раньше, чем иссякнет собственный запас монет.
                </p>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <div className="rounded-lg overflow-hidden shadow-lg border border-slate-600/50 transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/15">
                  <img 
                    src="/images/1.jpg" 
                    alt="Начальный капитал и цель" 
                    className="w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Раунд ставок */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col-reverse md:flex-row gap-8 items-center">
              <div className="md:w-1/3 flex justify-center">
                <div className="rounded-lg overflow-hidden shadow-lg border border-slate-600/50 transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/15">
                  <img 
                    src="/images/2.jpg" 
                    alt="Раунд ставок" 
                    className="w-full object-contain"
                  />
                </div>
              </div>
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  🎲 3. Раунд ставок
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  Поединок разбит на последовательные ходы, ограниченные по времени. В каждом ходе оба соперника в тайне друг от друга одновременно выбирают ставку от одной до пятидесяти монет. Как только решения зафиксированы, ставки раскрываются и безвозвратно сгорают. Если одна ставка превышает другую, Камень смещается на одну ступень к победителю хода; при равенстве — остаётся на месте. Игрок, не успевший сделать ставку вовремя, автоматически признаётся проигравшим весь матч. Когда у одного из соперников золото заканчивается, противник волен двигать Камень минимальными ставками, пока не доведёт его до вершины.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Завершение матча */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🏆 4. Завершение матча
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Победа достигается либо поднятием Камня на пятую ступень, либо исчерпанием золотого запаса у соперника. Возможен и двойной проигрыш: если золото у обоих закончилось, а Камень не достиг вершины, оба участника лишаются права на лидерство.
            </p>
          </div>

          {/* 5. Армия последователей и движение по лигам */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  ⚔️ 5. Армия последователей и движение по лигам
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Каждый матч увеличивает или уменьшает численность вашей кочевой армии — количество последователей, готовых идти за вами. Величина изменения зависит от лиги, в которой проходит поединок.
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Тренировочная лига: победитель привлекает 10 новых воинов, проигравший никого не теряет.<br />
                  Деревянная лига: результат матча изменяет армию на 30 последователей.<br />
                  Каменная лига: на кону 60 воинов.<br />
                  Золотая лига: каждая партия стоит 90 бойцов.<br />
                  Императорская лига: в финале результат сражения прибавляет или отнимает 180 последователей.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  С третьей подряд победы срабатывает полуторный коэффициент: к базовому приросту армии добавляется ещё 50 %. Потеря при поражении остаётся прежней, поэтому каждый расчёт требует хладнокровия.
                </p>
              </div>
              <div className="md:w-1/3 flex justify-center">
                <div className="rounded-lg overflow-hidden shadow-lg border border-slate-600/50 transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/15">
                  <img 
                    src="/images/3.jpg" 
                    alt="Армия последователей" 
                    className="w-full object-contain"
                  />
                </div>
              </div>
            </div>
            
            {/* Таблица лиг */}
            <div className="overflow-x-auto mt-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-700/50">
                    <th className="border border-slate-600 p-3 text-left text-blue-400">Лига</th>
                    <th className="border border-slate-600 p-3 text-left text-blue-400">Диапазон армии (последователи)</th>
                    <th className="border border-slate-600 p-3 text-left text-blue-400">Прирост/потеря за матч</th>
                    <th className="border border-slate-600 p-3 text-left text-blue-400">При серии ≥ 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-800/30 hover:bg-slate-700/30">
                    <td className="border border-slate-600 p-3 text-gray-300">Тренировочная</td>
                    <td className="border border-slate-600 p-3 text-gray-300">0 – 29</td>
                    <td className="border border-slate-600 p-3 text-gray-300">+10 / 0</td>
                    <td className="border border-slate-600 p-3 text-gray-300">+15</td>
                  </tr>
                  <tr className="bg-slate-800/30 hover:bg-slate-700/30">
                    <td className="border border-slate-600 p-3 text-gray-300">Деревянная</td>
                    <td className="border border-slate-600 p-3 text-gray-300">30 – 149</td>
                    <td className="border border-slate-600 p-3 text-gray-300">±30</td>
                    <td className="border border-slate-600 p-3 text-gray-300">+45</td>
                  </tr>
                  <tr className="bg-slate-800/30 hover:bg-slate-700/30">
                    <td className="border border-slate-600 p-3 text-gray-300">Каменная</td>
                    <td className="border border-slate-600 p-3 text-gray-300">150 – 359</td>
                    <td className="border border-slate-600 p-3 text-gray-300">±60</td>
                    <td className="border border-slate-600 p-3 text-gray-300">+90</td>
                  </tr>
                  <tr className="bg-slate-800/30 hover:bg-slate-700/30">
                    <td className="border border-slate-600 p-3 text-gray-300">Золотая</td>
                    <td className="border border-slate-600 p-3 text-gray-300">360 +</td>
                    <td className="border border-slate-600 p-3 text-gray-300">±90</td>
                    <td className="border border-slate-600 p-3 text-gray-300">+135</td>
                  </tr>
                  <tr className="bg-slate-800/30 hover:bg-slate-700/30">
                    <td className="border border-slate-600 p-3 text-gray-300">Императорская</td>
                    <td className="border border-slate-600 p-3 text-gray-300"><em>топ-64 вождя</em></td>
                    <td className="border border-slate-600 p-3 text-gray-300">±180</td>
                    <td className="border border-slate-600 p-3 text-gray-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Как стать Императором */}
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col-reverse md:flex-row gap-8 items-center">
              <div className="md:w-1/3 flex justify-center">
                <div className="rounded-lg overflow-hidden shadow-lg border border-slate-600/50 transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/15">
                  <img 
                    src="/images/4.jpg" 
                    alt="Как стать Императором" 
                    className="w-full object-contain"
                  />
                </div>
              </div>
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  👑 6. Как стать Императором
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  По завершении сезона все игроки ранжируются по числу последователей; Шестьдесят четыре владельца самых крупных кочевых армий образуют Императорскую лигу и вступают в финальные поединки. Из них отбираются предприниматели и студенты, прошедшие верификацию, для участия оффлайн в финальном чемпионате в рамках форума РОСТКИ 2025. Как и две тысячи лет назад, лидерство достаётся не тем, у кого сильнее меч, а тем, кто готов рисковать ресурсом, видеть на несколько ходов вперёд и вдохновлять людей своим примером. Поднимайте Камень — убедитесь, что именно за вами последует самая большая армия степи.
                </p>
              </div>
            </div>
          </div>

          {/* Кнопка возврата */}
          <div className="text-center mt-10">
            <Link href="/">
              <button className="py-3 px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/25 hover:scale-105">
                Вернуться к игре
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 