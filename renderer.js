window.addEventListener('DOMContentLoaded', () => {
  const minutesInput = document.getElementById('minutesInput')
  const startBtn = document.getElementById('startBtn')
  const resetBtn = document.getElementById('resetBtn')
  const timerDisplay = document.getElementById('timerDisplay')
  const cyclesCountEl = document.getElementById('cyclesCount')
  let soundPath = ''

  let remainingSeconds = 0
  let intervalId = null

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    const mm = String(m).padStart(2, '0')
    const ss = String(s).padStart(2, '0')
    return `${mm}:${ss}`
  }

  function setRunningState(isRunning) {
    startBtn.disabled = isRunning
    resetBtn.disabled = !isRunning && remainingSeconds === 0
    minutesInput.disabled = isRunning
  }

  async function tick() {
    remainingSeconds -= 1
    if (remainingSeconds <= 0) {
      remainingSeconds = 0
      timerDisplay.textContent = '00:00'
      clearInterval(intervalId)
      intervalId = null
      setRunningState(false)
      try {
        if (soundPath) {
          const audio = new Audio()
          const url = 'file:///' + soundPath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1:') //thank u stackoverflow
          audio.src = url
          audio.volume = 1.0
          await audio.play().catch(() => {})
        } else {
          await (window.pomo?.beep ? window.pomo.beep() : Promise.resolve())
        }
      } catch (e) {
        console.error('Failed to play notification sound', e)
      }
      try {
        const next = window.pomo?.incrementCycles ? await window.pomo.incrementCycles() : 0
        if (cyclesCountEl && Number.isFinite(next)) cyclesCountEl.textContent = String(next)
      } catch (e) {
        console.error('Failed to increment cycles', e)
      }
      return
    }
    timerDisplay.textContent = formatTime(remainingSeconds)
  }

  function startTimer() {
    const minutes = parseInt(minutesInput.value, 10)
    const mins = Number.isFinite(minutes) && minutes >= 0 ? minutes : parseInt(minutesInput.placeholder || '25', 10)
    remainingSeconds = Math.max(0, mins) * 60
    timerDisplay.textContent = formatTime(remainingSeconds)
    if (remainingSeconds === 0) {
      setRunningState(false)
      return
    }
    if (intervalId) clearInterval(intervalId)
    intervalId = setInterval(tick, 1000)
    setRunningState(true)
  }

  function resetTimer() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    remainingSeconds = 0
    timerDisplay.textContent = '00:00'
    setRunningState(false)
  }

  startBtn.addEventListener('click', startTimer)
  resetBtn.addEventListener('click', resetTimer)

  timerDisplay.textContent = '00:00'
  setRunningState(false)
  ;(async () => {
    try {
      const n = window.pomo?.getCycles ? await window.pomo.getCycles() : 0
      if (cyclesCountEl && Number.isFinite(n)) cyclesCountEl.textContent = String(n)
      soundPath = window.pomo?.getSoundPath ? await window.pomo.getSoundPath() : ''
    } catch (e) {
      console.error('Failed to load cycles', e)
    }
  })()

  if (window.pomo?.onSoundPathChanged) {
    window.pomo.onSoundPathChanged((p) => {
      soundPath = p || ''
    })
  }
})