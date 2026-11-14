function calculatebmi() 
{
    const heightinput=document.getElementById("height").value;
    const weightinput=document.getElementById("weight").value;
        const resultContainer=document.getElementById('result-container');
    const bmivalue=document.getElementById('bmi-value');
    const bmicategory=document.getElementById('bmi-category');
    const bmisquare=document.getElementById('bmi-square');
        const height=parseFloat(heightinput);
        const weight=parseFloat(weightinput);
        if(!height||!weight||height<=0||weight<=0){
alert("Please enter valid height and weight values.");
return;
        }
const heightinmeters=height/100;
const bmi=weight/(heightinmeters*heightinmeters);
const bmiRounded=bmi.toFixed(1);
let category="";
let color="";

if(bmi<18.5)
        {
                category="Underweight";
                color="skyblue";

        } 
        else if(bmi>=18.5&&bmi<25)
        {
                category="Normal weight";
                color="palegreen";

        }
    else if(bmi>=25 &&bmi<=29.9){
        category="Overweight";
        color="orange";
    }    
    else
    {
        category="Obese";
        color="red";
    } 
    bmivalue.innerHTML=bmiRounded;
    bmicategory.innerHTML='Category:'+category;
    bmisquare.style.backgroundColor=color;
    resultContainer.classList.remove('hidden');
    resultContainer.style.display='block';

   
}


