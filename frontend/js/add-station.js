document.getElementById("stationForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const station = {
        stationName: document.getElementById("stationName").value,
        location: document.getElementById("location").value,
        chargerType: document.getElementById("chargerType").value,
        availableSlots: parseInt(document.getElementById("availableSlots").value)
    };

        const response = await fetch(`https://ev-finder-backend-production.up.railway.app/api/stations`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(station)

        });

        if (response.ok) {

            alert("Station Added Successfully!");

            document.getElementById("stationForm").reset();

        } else {

            alert("Failed to Add Station!");

        }

    } catch (error) {

        console.error(error);

        alert("Server Error!");

    }

});