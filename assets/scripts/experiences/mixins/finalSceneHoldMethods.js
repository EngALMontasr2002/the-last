export default finalSceneHoldMethods = {
    holdDown() {
        if (this.holdData.isHolding || !this.moduleInstance.hasHoldAvailable) return
            // Reset base time
        this.holdData.baseTime = Date.now()
            // Set flag
        this.holdData.isHolding = true
            // Start cursor animation
        this.moduleInstance.call('holdDown', this.holdData.holdDuration, 'Cursor')
            // Animate gl hold
        this.animateHoldDown ? .()
    },

    holdUp(isComplete = false) {
        if (!this.holdData.isHolding || !this.moduleInstance.hasHoldAvailable) return
            // Set flag
        this.holdData.isHolding = false
            // Stop cursor animation
        this.moduleInstance.call('holdUp', this.holdData.holdDuration, 'Cursor')
            // Animate gl hold
        if (!isComplete) {
            this.animateHoldUp ? .()
        }
    },

    updateHold() {
        if (!this.holdData.isHolding) return

        const dateNow = Date.now()
        const elapsedTime = dateNow - this.holdData.baseTime

        // If minimum duration passed
        if (elapsedTime > this.holdData.holdDuration) {
            this.holdUp(true)
            this.startMasterAnimation ? .()
        }
    }
}